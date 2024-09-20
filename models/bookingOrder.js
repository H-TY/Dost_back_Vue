import { Schema, model } from 'mongoose'

const bookingOrderData = new Schema({
  name: {
    type: String,
    required: [true, '訂單使用者名稱必填']
  },
  phone: {
    type: String,
    required: [true, '訂單電話使用者必填']
  },
  image: {
    type: String,
    required: [false, '訂單狗狗圖片選填']
  },
  dogName: {
    type: String,
    required: [true, '訂單狗狗名字必填']
  },
  bookingDate: {
    type: String,
    required: [true, '訂單預約日期必填']
  },
  bookingTime: {
    type: [String],
    required: [true, '訂單預約時段必填']
  },
  totalBookingTime: {
    type: Number,
    required: [true, '訂單預約總時數必填'],
    min: [0, '訂單預約總時數不能小於 0']
  },
  totalPrice: {
    type: Number,
    required: [true, '訂單預約總金額必填'],
    min: [0, '訂單預約總金額不能小於 0']
  },
  accountName: {
    type: String,
    required: [true, '帳戶名稱必填']
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('bookingOrder', bookingOrderData)
