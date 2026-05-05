import { Router } from 'express';
import * as auth from '../middlewares/auth.js';
import upload from '../middlewares/upload.js'; // 用來解析前端傳來的 form-data 資料（包含圖片資料）
import { create, getId, edit } from '../controllers/dogs.js';

const router = Router();

router.post('/', auth.authJwt, create);
// 查詢單個物件
router.get('/:id', getId);
// 編輯，根據 id 找到物件，修改物件內容並覆蓋原先內容↓
router.patch('/:id', auth.authJwt, edit);

export default router;
