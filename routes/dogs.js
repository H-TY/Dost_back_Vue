import { Router } from 'express';
import * as auth from '../middlewares/auth.js';
import admin from '../middlewares/admin.js';
import upload from '../middlewares/upload.js';
import { create, getAll, get, getId, edit } from '../controllers/dogs.js';

const router = Router();

// 建立狗狗資料
router.post('/', auth.authJwt, admin, upload, create);

// ★★★ router.get('/all', ~) 排序上要在 router.get('/:id', getId) 的前面，不然 all 會被當成 id ★★★
// 查詢多個物件（含下架的狗狗），管理員可以看到所有狗狗資訊(含未上架）↓
router.get('/all', auth.authJwt, admin, getAll);

// 查詢多個物件，使用者只能看到有標註上架的狗狗資訊
router.get('/', get);

// 查詢單個物件
router.get('/:id', getId);

// 編輯，根據 id 找到物件，修改物件內容並覆蓋原先內容↓
router.patch('/:id', auth.authJwt, admin, upload, edit);

export default router;
