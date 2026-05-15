import { Router } from 'express';
import * as auth from '../middlewares/auth.js';
import upload from '../middlewares/upload.js'; // 用來解析前端傳來的 form-data 資料（包含圖片資料）
import stringfyTOparse from '../middlewares/data_stringifyTOparse.js';
import { createAndUpdate, profile } from '../controllers/userSetting.js';

const router = Router();

router.post('/', auth.authJwt, upload, stringfyTOparse, createAndUpdate);
router.get('/settingProfile', auth.authJwt, profile);

export default router;
