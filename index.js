import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import mongoSanitize from 'express-mongo-sanitize'
import { rateLimit } from 'express-rate-limit'
import Ruser from './routes/user.js'
import Rdogs from './routes/dogs.js'
import './passport/passport.js'

const app = express()

// 一段時間內超過限制請求次數，封掉發請求的 IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 時間設定（以毫秒為單位），15分鐘 × 60秒數 × 1000毫秒
  limit: 100, // 上述時間內，請求次數上限
  standardHeaders: 'draft-7', // draft-7 為內建回應的 Headers 設定
  legacyHeaders: false,
  // 自訂狀態
  statusCode: StatusCodes.TOO_MANY_REQUESTS,
  // 自訂回應訊息（當超出請求次數會發出訊息）
  message: '發出請求過多',
  // 老師提供的 handler 設定
  handler(req, res, next, options) {
    res.status(options.StatusCodes).json({
      success: false,
      message: options.message
    })
  }
}))

// 讓前端可以發請求給後端
// 也可以當成 middleware 使用
app.use(cors({
  // origin = 請求來源
  // callback(錯誤, 是否允許)
  origin(origin, callback) {
    // 若來源是 undefined 或 包含文字 localhost 或 包含文字 127.0.0.1；允許通過
    if (origin === undefined || origin.includes('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true)
    } else {
      // 若非上述情況，丟出錯誤訊息；拒絕通過
      callback(new Error('CORS'), false)
    }
  }
}))

// 解析網頁的 body，轉為 json 檔
app.use(express.json())
app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    messages: '資料格式錯誤'
  })
})

// 消毒用 ↓
app.use(mongoSanitize())

// 使用路由設定
app.use('/user', Ruser)
app.use('/dogs', Rdogs)
// 當不符合上述路徑的請求處理的東西，都會進入 app.all()
app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到'
  })
})

app.listen(process.env.PORT || 4000, async () => {
  console.log('伺服器啟動')
  await mongoose.connect(process.env.DB_URL)
  // sanitizeFilter：mongoose 內建的消毒語法（因 mongoDB 的物件為美金符號 "$" 開頭，任何人都可以藉由這個方式執行動作，會有資料安全的問題，故將美金符號開頭的東西加上東西）
  mongoose.set('sanitizeFilter', true)
  console.log('DB 資料庫連線成功')
})
