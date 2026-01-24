import express from 'express';
import { loginWithGoogle, register, login } from '../controllers/auth.controller.js';

const router = express.Router();

// Google Login
router.post('/google', loginWithGoogle);

// Regular Register & Login
router.post('/register', register);
router.post('/login', login);

export default router;