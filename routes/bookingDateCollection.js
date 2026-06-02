import { Router } from 'express';
import * as auth from '../middlewares/auth.js';
import admin from '../middlewares/admin.js';
import upload from '../middlewares/upload.js'; // 用來解析前端傳來的 form-data 資料（包含圖片資料）
import { create, get, deleteData } from '../controllers/bookingDateCollection.js';

const router = Router();

// 建立預約時間列表
router.post('/', auth.authJwt, upload, create);

// 查詢多個物件
router.get('/', get);

// 刪除預約時段資料（依據已取消訂單）
router.patch('/deleteData', auth.authJwt, upload, deleteData);

// 查詢單個物件
// router.get('/:id', getId);

export default router;
