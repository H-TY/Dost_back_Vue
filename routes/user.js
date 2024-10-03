import { Router } from 'express'
import upload from '../middlewares/upload.js'
import { create, login, extend, profile, edit, logout } from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

router.post('/', create)
router.post('/login', auth.authLogin, login)
router.patch('/extend', auth.authJwt, extend) // token 舊換新的路徑
router.get('/profile', auth.authJwt, profile)
router.patch('/:id', auth.authJwt, upload, edit) // 使用者 上傳/修改 含有圖片時，無法直接儲存至後端資料庫，需用 upload 做圖片轉換成路徑
// 暫時不用，留作紀錄 router.patch('/noImgChange/:id', auth.authJwt, edit) // 使用者 上傳/修改 沒有圖片時，不需用 upload
router.delete('/logout', auth.authJwt, logout)

export default router
