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

// 使用者 上傳/修改 含有圖片時，無法直接儲存至後端資料庫，需用 upload 做圖片轉換成路徑
// 不寫成 router.patch('/:id', ....) 因為使用者 id 可以在 authJwt 驗證時取得，故不需要前端傳送使用者 id 的參數；除非是第三者要修改指定使用者的資料（例如：管理者修改 A 使用者資料）
router.patch('/', auth.authJwt, upload, emptyStringTOnull, edit);

router.delete('/logout', auth.authJwt, logout);

export default router;
