import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
import bcrypt from 'bcrypt'
import Muser from '../models/user.js'

// 設定帳密的驗證策略（login 時，用來驗證帳號密碼）
passport.use('login', new passportLocal.Strategy({
  usernameField: 'account',
  passwordField: 'password'
}, async (account, password, done) => {
  try {
    const user = await Muser.findOne({ account })
    // 若找不到相符的帳號，丟出錯誤訊息
    if (!user) {
      throw new Error('ACCOUNT')
    }
    // 若密碼不符，丟出錯誤訊息
    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('PASSWORD')
    }
    // done(錯誤, 使用者資料, 要傳出的錯誤訊息)
    return done(null, user, null)
  } catch (error) {
    console.log(error)
    if (error.message === 'ACCOUNT') {
      return done(null, null, { message: '使用者帳號不存在' })
    } else if (error.message === 'PASSWORD') {
      return done(null, null, { message: '使用者密碼錯誤' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))

// 設定 passport 的 JWT 驗證方式（使用者向前端發出請求索取資料時，前段由 token 判斷是否接受請求）
passport.use('jwt', new passportJWT.Strategy({
  // JWT 的來源（這裡是從 fromAuthHeaderAsBearerToken 取得 token）
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(),
  // 要用 JWT_SECRET 去做驗證
  secretOrKey: process.env.JWT_SECRET,
  // 設定 Req 傳去 Callback，也就是下面的函釋 async (req, payload, done) => {} 裡，取得請求的資訊
  passReqToCallback: true,
  // 設定忽略 token 過期的檢查，因使用者可能使用到一半被登出，故會給舊換新的機制，這樣就需要允許過期的 token 進入路由
  ignoreExpiration: true
}, async (req, payload, done) => {
  try {
    // 判斷 token 是否過期
    // payload.exp 是秒為單位，但 js 是以毫秒計算，故要再乘上 1000
    // 若 payload.exp * 1000 小於現在的時間，表示 token 已過期
    const expired = payload.exp * 1000 < new Date().getTime()

    /* 將路徑拆解成參數的話 ↓
      http://localhost:4000/user/test?aaa=111&bbb=222
      req.originUrl = /user/test?aaa=111&bbb=222
      req.baseUrl = /user
      req.path = /test
      req.query = { aaa: 111, bbb: 222 }
    */
    const url = req.baseUrl + req.path
    // url !== '/user/extend' 網址不是 token 舊換新
    // url !== '/user/logout' 網址不是登出
    if (expired && url !== '/user/extend' && url !== '/user/logout') {
      throw new Error('EXPIRED')
    }

    // 取出 JWT
    const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    const user = await Muser.findOne({ _id: payload._id, tokens: token })
    if (!user) {
      throw new Error('JWT')
    }

    return done(null, { user, token }, null)
  } catch (error) {
    console.log(error)
    if (error.message === 'EXPIRED') {
      return done(null, null, { message: '登入過期' })
    } else if (error.message === 'JWT') {
      return done(null, null, { message: '登入無效' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))
