import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

// Schema 定義資料結構，並輸出成 model 物件，用於驗證資料類型

// 購物車資料定義
const cartSchema = new Schema({
  // 商品 ID
  p_id: {
    type: ObjectId,
    ref: 'products',
    required: [true, '使用者購物車商品必填']
  },
  // 數量
  quantity: {
    type: Number,
    required: [true, '使用者購物車商品數量必填'],
    min: [1, '購物車添加商品數量至少為 1']
  }
})

// 使用者資料定義
const userData = new Schema({
  // 帳號
  account: {
    type: String,
    required: [true, '使用者帳號必填'],
    minLength: [4, '使用者帳號文字最少 4 個字'],
    maxLength: [20, '使用者帳號文字最多 20 個字'],
    unique: true,
    validate: {
      validator(value) {
        return validator.isAlphanumeric(value)
      },
      message: '使用者帳號格式錯誤'
    }
  },
  // 密碼
  password: {
    type: String,
    required: [true, '密碼必填']
  },
  // E-mail
  email: {
    type: String,
    required: [true, '信箱必填'],
    validate: {
      validator(value) {
        return validator.isEmail(value)
      },
      message: '使用者信箱格式錯誤'
    }
  },
  // token
  tokens: {
    type: [String]
  },
  // 購物車
  cart: {
    type: [cartSchema]
  },
  // 使用者權限（一般使用者或是管理員，default 為預設）
  role: {
    type: Number,
    default: UserRole.USER
  }
}, {
  // timestamps 紀錄帳號創建時間和帳號最後更新時間
  timestamps: true,
  // versionKey 紀錄資料修改幾次
  versionKey: false
})

// 密碼加密
// 在通過 userData 定義的驗證並於儲存前
userData.pre('save', function (next) {
  const user = this
  // .isModified(path) 檢查文檔的特定路徑（字段）是否被修改，回傳 Boolean 值。
  if (user.isModified('password')) {
    if (user.password.length < 4 || user.password.length > 20) {
      // 建立錯誤
      // Error 來自 mongoose 套件
      // .Validation 指的是 userData (外層)
      const error = new Error.ValidationError()

      // 內層添加一個 password 欄位的錯誤
      error.addError('password', new Error.ValidationError({ message: '使用者密碼長度不符' }))
      next(error)
      return
    } else {
      // 加密使用者密碼
      // bcrypt.hashSync(要加密的物件, 加密次數)
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  next()
})

// 要用來做購物車右上角顯示紅點（提示購物車內有東西）
// userData.virtual('自訂名稱') 在原本定義的資料結構（userData ），建立虛擬欄位
// 可以設定資料如何產生（.get(function () {})）或資料修改時要執行的動作
userData.virtual('cartHave').get(function () {
  const user = this // this 代指現在的那一筆資料
  // .reduce((目前總額, 現在迴圈跑到的東西) => { return total + current.quantity 目前數量}, 加總的初始值)
  return user.cart.reduce((total, current) => {
    return total + current.quantity
  }, 0)
})

export default model('users', userData)
