import { Schema, model } from 'mongoose'

const dogsData = new Schema({
  image: {
    type: String,
    required: [true, '狗狗圖片必填']
  },
  dogName: {
    type: String,
    required: [true, '狗狗名字必填']
  },
  age: {
    type: Number,
    required: [true, '狗狗年齡必填']
  },
  price: {
    type: Number,
    required: [true, '預約價格必填'],
    min: [0, '商品價格不能小於 0']
  },
  booking: {
    type: String,
    required: [true, '預約狀態必填']
  },
  bookingTime: {
    type: [String],
    required: [false, '預約已滿時，預約時段可不填']
  },
  feature: {
    type: String,
    required: [true, '狗狗性格、特徵必填']
  },
  sell: {
    type: Boolean,
    required: [true, '上架狀態必填']
  },
  counter: {
    type: Number,
    required: [true, '點檯數字必填'],
    min: [0, '點檯數字不能小於 0']
  }
}, {
  timestamps: true,
  versionKey: false
})

export default model('dogs', dogsData)
