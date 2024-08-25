import validator from 'validator'
import MbookingOrderData from '../models/bookingOrder.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
  try {
    console.log('Request Body:', req.body)
    const result = await MbookingOrderData.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message

      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const getAll = async (req, res) => {
  try {
    console.log('req.query.search', req.query.search)
    const regex = new RegExp(req.query.search || '', 'i')
    const data = await MbookingOrderData
      // 搜尋功能，採用上述的 regex 做參數
      .find({
        // $or 符合其中一個條件即可
        $or: [
          { name: regex }, // 狗狗名字要符合正則表達式
          { feature: regex }]
      })
    const total = await MbookingOrderData.estimatedDocumentCount()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const get = async (req, res) => {
  try {
    console.log('req.query.search', req.query.search)
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await MbookingOrderData
      // 搜尋功能，採用上述的 regex 做參數
      .find({
        // $or 符合其中一個條件即可
        $or: [
          { accountName: regex },
          { feature: regex }]
      })
    const total = await MbookingOrderData.estimatedDocumentCount()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
    console.log('data', data, 'total', total)
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
