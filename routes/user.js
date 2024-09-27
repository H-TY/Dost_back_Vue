import { Router } from 'express'
import upload from '../middlewares/upload.js'
import { create, login, extend, profile, edit, logout } from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

router.post('/', create)
router.post('/login', auth.authLogin, login)
router.patch('/extend', auth.authJwt, extend) // token 舊換新的路徑
router.get('/profile', auth.authJwt, profile)
router.patch('/:id', auth.authJwt, upload, edit) // 使用者 上傳/修改 圖片或資料
router.delete('/logout', auth.authJwt, logout)

export default router
