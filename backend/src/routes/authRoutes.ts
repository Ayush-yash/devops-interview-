import express from 'express';
import { register, login } from '../controllers/authController';
import { validateSchema, registerSchema, loginSchema } from '../middleware/validation';

const router = express.Router();

router.post('/register', validateSchema(registerSchema) as any, register as any);
router.post('/login', validateSchema(loginSchema) as any, login as any);

export default router;
