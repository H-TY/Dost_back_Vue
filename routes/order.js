import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import admin from '../middlewares/admin.js'
import upload from '../middlewares/upload.js'
import countOrder from '../middlewares/countOrder.js'
import { create, get, getAll, edit, topOrder } from '../controllers/order.js'

const router = Router()

// 引用 middlewares/upload.js 是為了解析前端傳來的 form-data 資料
router.post('/', auth.authJwt, upload, create)
router.get('/all', auth.authJwt, admin, getAll)
router.get('/topOrder', countOrder, topOrder)
router.get('/', auth.authJwt, get)
// 編輯，根據 id 找到物件，修改物件內容並覆蓋原先內容↓
router.patch('/:id', auth.authJwt, edit)

export default router
