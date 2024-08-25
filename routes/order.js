import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import admin from '../middlewares/admin.js'
import upload from '../middlewares/upload.js'
import { create, getAll, get } from '../controllers/order.js'

const router = Router()

// 引用 middlewares/upload.js 是為了解析前端傳來的 form-data 資料
router.post('/', auth.authJwt, upload, create)
router.get('/', auth.authJwt, get)
router.get('/all', auth.authJwt, admin, getAll)

// router.get('/', auth.authJwt, get)
// router.get('/:id', auth.authJwt, getId)
// router.patch('/:id', auth.authJwt, edit)

export default router
