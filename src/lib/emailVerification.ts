import dns from 'dns';
import nodemailer from 'nodemailer';
import axios from 'axios';
import { promisify } from 'util';
import net from 'net';

const resolveMx = promisify(dns.resolveMx);

export const validateEmailSyntax = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

export const verifyDomain = (email: string): boolean => {
  const domain = email.split('@')[1];
  return Boolean(domain);
};

export const validateMxRecords = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1];
  try {
    const addresses = await resolveMx(domain);
    return addresses && addresses.length > 0;
  } catch (error) {
    return false;
  }
};

export const smtpCheck = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1];
  try {
    const addresses = await resolveMx(domain);
    if (addresses.length === 0) return false;

    const [mailServer] = addresses;
    const client = net.createConnection(25, mailServer.exchange);

    return new Promise((resolve) => {
      client.on('data', () => {
        client.write(`HELO ${domain}\r\n`);
        client.write(`MAIL FROM: <test@${domain}>\r\n`);
        client.write(`RCPT TO: <${email}>\r\n`);
        client.write('QUIT\r\n');
      });

      client.on('error', () => resolve(false));
      client.on('end', () => resolve(true));
    });
  } catch (error) {
    return false;
  }
};

export const isDisposableEmail = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1];
  try {
    const response = await axios.get(`https://open.kickbox.com/v1/disposable/${domain}`);
    return response.data.disposable;
  } catch (error) {
    return false;
  }
};

export const checkCatchAll = async (domain: string): Promise<boolean> => {
  try {
    // Resolve MX records for the domain
    const mxRecords = await new Promise<dns.MxRecord[]>((resolve, reject) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });

    if (mxRecords.length === 0) {
      console.log('No MX records found for domain');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: mxRecords[0].exchange,
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    const invalidEmail = `invalid-${Date.now()}@${domain}`;

    return new Promise<boolean>((resolve, reject) => {
      transporter.verify((error: any, success: any) => {
        if (error) {
          reject('Error verifying SMTP connection: ' + error.message);
        } else {
          transporter.sendMail(
            {
              from: 'test@example.com',
              to: invalidEmail,
              subject: 'Test Email',
              text: 'This is a test email.',
            },
            (err: any, info: any) => {
              transporter.close();
              if (err) {
                if (err.responseCode >= 400 && err.responseCode < 500) {
                  resolve(false); // Not a catch-all
                } else {
                  reject('SMTP error: ' + err.message);
                }
              } else {
                resolve(true); // Catch-all
              }
            }
          );
        }
      });
    });
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}

export const checkTemporaryBlock = async (email: string): Promise<boolean> => {
  const domain = email.split('@')[1];

  try {
    // Resolve MX records for the domain
    const mxRecords = await new Promise<dns.MxRecord[]>((resolve, reject) => {
      dns.resolveMx(domain, (err, addresses) => {
        if (err) reject(err);
        else resolve(addresses);
      });
    });

    if (mxRecords.length === 0) {
      console.log('No MX records found for domain');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: mxRecords[0].exchange,
      port: 25,
      secure: false,
      tls: {
        rejectUnauthorized: false,
      },
    });

    return new Promise<boolean>((resolve, reject) => {
      transporter.verify((error: any, success: any) => {
        if (error) {
          reject('Error verifying SMTP connection: ' + error.message);
        } else {
          transporter.sendMail(
            {
              from: 'test@example.com',
              to: email,
              subject: 'Test Email',
              text: 'This is a test email.',
            },
            (err: any, info: any) => {
              transporter.close();
              if (err) {
                if (err.responseCode >= 400 && err.responseCode < 500) {
                  resolve(true); // Temporary block detected
                } else {
                  reject('SMTP error: ' + err.message);
                }
              } else {
                resolve(false); // No temporary block
              }
            }
          );
        }
      });
    });
  } catch (err) {
    console.error('Error:', err);
    return false;
  }
}


export const verifyEmail = async (email: string) => {
  const isValidSyntax = validateEmailSyntax(email);
  const isDomainValid = verifyDomain(email);
  const hasMxRecords = await validateMxRecords(email);
  const isSmtpValid = await smtpCheck(email);
  const isDisposable = await isDisposableEmail(email);
  const isCheckAll = await checkCatchAll(email);
  const isTemporaryBlocked = await checkTemporaryBlock(email);

  return {
    email,
    isValidSyntax,
    isDomainValid,
    hasMxRecords,
    isSmtpValid,
    isDisposable,
    isCheckAll,
    isTemporaryBlocked
  };
};
