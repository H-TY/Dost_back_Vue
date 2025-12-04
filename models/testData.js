import { Schema, model } from 'mongoose'

const testsData = new Schema({
  userName: {
    type: String,
    required: [true, '使用者名字必填']
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

export default model('tests', testsData)
