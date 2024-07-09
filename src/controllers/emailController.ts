import { Request, Response } from 'express';
import { verifyEmail } from '../lib/emailVerification';

export const checkEmail = async (req: Request, res: Response) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ error: 'Email is required' });
  }

  try {
    const result = await verifyEmail(email);
    res.send(result);
  } catch (error) {
    res.status(500).send({ error: 'Server error' });
  }
};
