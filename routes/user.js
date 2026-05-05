import { Router } from 'express';
import upload from '../middlewares/upload.js'; // 用來解析前端傳來的 form-data 資料（包含圖片資料）
import emptyStringTOnull from '../middlewares/field_ emptyStringTOnull.js';
import { create, login, extend, profile, edit, logout } from '../controllers/user.js';
import * as auth from '../middlewares/auth.js';

const router = Router();

router.post('/', create);
router.post('/login', auth.authLogin, login);
router.patch('/extend', auth.authJwt, extend); // token 舊換新的路徑
router.get('/profile', auth.authJwt, profile);
router.patch('/:id', auth.authJwt, upload, emptyStringTOnull, edit); // 使用者 上傳/修改 含有圖片時，無法直接儲存至後端資料庫，需用 upload 做圖片轉換成路徑
router.delete('/logout', auth.authJwt, logout);

export default router;
