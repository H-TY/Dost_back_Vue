import UserRole from '../enums/UserRole.js'
import { StatusCodes } from 'http-status-codes'

export default (req, res, next) => {
  if (req.user.role !== UserRole.ADMIN) {
    // 狀態碼 403 FORBIDDEN 我知道你有登入以及身分是誰，但你沒有權限
    res.status(StatusCodes.FORBIDDEN).json({
      success: false,
      message: '您沒有管理員權限'
    })
  } else {
    next()
  }
}
