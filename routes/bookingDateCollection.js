import { Router } from 'express';
import * as auth from '../middlewares/auth.js';
import admin from '../middlewares/admin.js';
import upload from '../middlewares/upload.js'; // 用來解析前端傳來的 form-data 資料（包含圖片資料）
import { create, get, update } from '../controllers/bookingDateCollection.js';

const router = Router();

// 建立預約時間列表
router.post('/', upload, create);

// 查詢多個物件
router.get('/', get);

// 查詢單個物件
// router.get('/:id', getId);

// 更新資料庫的資料
router.patch('/:id', auth.authJwt, upload, update);

export default router;
