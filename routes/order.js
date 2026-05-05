import { Router } from 'express';
import * as auth from '../middlewares/auth.js';
import admin from '../middlewares/admin.js';
import upload from '../middlewares/upload.js'; // 用來解析前端傳來的 form-data 資料（包含圖片資料）
import stringfyTOparse from '../middlewares/data_stringifyTOparse.js';
import { create, get, getAll, edit, topOrder } from '../controllers/order.js';

const router = Router();

router.post('/', auth.authJwt, upload, stringfyTOparse, create);
router.get('/all', auth.authJwt, admin, getAll);
router.get('/topOrder', topOrder);
router.get('/', auth.authJwt, get);
// 編輯，根據 id 找到物件，修改物件內容並覆蓋原先內容↓
router.patch('/:id', auth.authJwt, edit);

export default router;
