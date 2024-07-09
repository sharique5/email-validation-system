import dns from 'dns';
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

export const verifyEmail = async (email: string) => {
  const isValidSyntax = validateEmailSyntax(email);
  const isDomainValid = verifyDomain(email);
  const hasMxRecords = await validateMxRecords(email);
  const isSmtpValid = await smtpCheck(email);
  const isDisposable = await isDisposableEmail(email);

  return {
    email,
    isValidSyntax,
    isDomainValid,
    hasMxRecords,
    isSmtpValid,
    isDisposable,
  };
};
