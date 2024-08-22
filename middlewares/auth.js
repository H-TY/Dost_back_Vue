import passport from 'passport'
import { StatusCodes } from 'http-status-codes'
import jsonwebtoken from 'jsonwebtoken'

// login 的驗證
export const authLogin = (req, res, next) => {
  // 會先執行 passport.js/login 的驗證策略，不管執行成功或失敗，會再執行後續的函式 (error, user, info) => {}
  // (error, user, info) => {} 三個參數會對應到 passport.js/login 的 done(錯誤, 使用者資料, 要傳出的錯誤訊息) 的參數
  passport.authenticate('login', { session: false }, (error, user, info) => {
    if (!user || error) {
      // passport.js/login 的驗證策略錯誤
      if (info.message === 'Missing credentials') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: 'false',
          message: '輸入欄位錯誤'
        })
      } else if (info.message === '未知錯誤') {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
      } else {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: info.message
        })
      }
    }
    req.user = user
    next()
  })(req, res, next)
}

// JWT 的驗證
export const authJwt = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (error, data, info) => {
    if (error || !data) {
      // passport.js/jwt 的驗證策略錯誤
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: '登入無效'
        })
      } else if (info.message === '未知錯誤') {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
      } else {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message
        })
      }
      return
    }
    req.user = data.user
    req.token = data.token
    next()
  })(req, res, next)
}
