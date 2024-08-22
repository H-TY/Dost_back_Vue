import { Router } from 'express'
import { create, login, extend, profile, logout } from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

router.post('/', create)
router.post('/login', auth.authLogin, login)
router.patch('/extend', auth.authJwt, extend) // token 舊換新的路徑
router.get('/profile', auth.authJwt, profile)
router.delete('/logout', auth.authJwt, logout)

export default router
