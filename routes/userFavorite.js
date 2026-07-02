import { Router } from 'express';
import * as auth from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { createAndadd, remove, profile, allUpdata } from '../controllers/userFavorite.js';

const router = Router();

router.post('/add', auth.authJwt, createAndadd);
router.post('/remove', auth.authJwt, remove);
router.get('/profile', auth.authJwt, profile);
router.put('/', auth.authJwt, allUpdata);

export default router;
