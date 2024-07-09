import { Router } from 'express';
import { checkEmail } from '../controllers/emailController';

const router = Router();

router.post('/verify', checkEmail);

export default router;
