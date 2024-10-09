import validator from 'validator'
import MbookingOrderData from '../models/bookingOrder.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
  try {
    // console.log('Request Body:', req.body)
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
    // 檢查是否有從前端傳入值 ↓
    // console.log('req.query.search', req.query.search)
    const sortBy = req.query.sortBy || 'bookingOrderNumber'
    const sortOrder = req.query.sortOrder || 'desc'

    // 從前端傳入要搜尋的值，再藉由值找到相對應的資料後，利用 regex 正則表達式將相關資料一併找出回傳前端
    // 正則表達式主要用於搜尋 "文字/字串" 資料類型，可以搜尋部分符合的資料
    // 正則表達式主要用於搜尋 "文字/字串" 資料類型
    // 若 req.query.search 是 '' 空值，表示要搜尋並回傳前端所有資料
    const regex = new RegExp(req.query.search || '', 'i')
    const data = await MbookingOrderData
      // 搜尋功能，採用上述的 regex 的參數做關鍵字搜尋
      .find({
        // $or 表示符合其中一個條件即可
        // 給的參數要能做正則表達式，假若用 _id 會失敗，會直接以 _id 去搜尋
        // 如果要用 _id 搜尋資料，須提供的是 24 字符的十六进制字符串（比如 "507f1f77bcf86cd799439011"）
        // const id = new ObjectId('507f1f77bcf86cd799439011')
        $or: [
          { name: regex },
          { feature: regex }]
      })
      .sort({ [sortBy]: sortOrder })

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
    // console.log('get_req.query.search', req.query.search)
    // console.log(typeof (req.query.search))

    // 設定要排序的欄位名稱
    // 因沒有從前端傳入 req.query.sortBy，故會採用 'bookingOrderNumber'
    const sortBy = req.query.sortBy || 'bookingOrderNumber'
    // 設定要排序的方式：asc 升冪（由小至大排序）；desc 降冪（由大至小排序）
    // 因沒有從前端傳入 req.query.sortOrder，故會採用 'desc'
    const sortOrder = req.query.sortOrder || 'desc'

    // 因有要找到指定的相關資料，故從前端傳入要搜尋的值（req.query.search＝User.value）↓
    // const { data } = await apiAuth.get('/order',{
    //   params: {
    //     search: User.value
    //   }
    // })
    // 再藉由值找到相對應的資料後，利用 regex 正則表達式將相關資料一併找出回傳前端
    // 正則表達式主要用於搜尋 "文字/字串" 資料類型，可以搜尋部分符合的資料
    // 欄位的資料格式需確保為 "文字/字串" 類型，正則表達式才有作用
    // 若 req.query.search 是 '' 空值，表示要搜尋所有資料並回傳前端
    const regex = new RegExp(req.query.search || '', 'i')
    const data = await MbookingOrderData
      // 搜尋功能，採用上述的 regex 的參數做關鍵字搜尋
      .find({
        // $or 符合其中一個條件即可
        $or: [
          { bookingOrderNumber: regex },
          { accountName: regex }
        ]
      })
      // 將搜尋出來的資料做排序，可視為預先排序，當使用者開啟頁面即可看到預先排序過的資料
      // 這邊設定以 bookingOrderNumber 做 desc 降冪排序
      .sort({ [sortBy]: sortOrder })

    const total = await MbookingOrderData.estimatedDocumentCount()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        data, total
      }
    })
    // console.log('data', data, 'total', total)
  } catch (error) {
    console.log(error)
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

export const edit = async (req, res) => {
  try {
    // console.log('req.params.id', req.params.id)
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    // .findByIdAndUpdate 搜尋並更新
    // 需先通過驗證 { runValidators: true }，再將 req.params.id 作為搜尋關鍵詞，更新相對 id 的 req.body，若失敗則拋出錯誤
    // 設置 new: true 返回更新後的使用者資料
    const userUpdate = await MbookingOrderData.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        orderStatus: userUpdate.orderStatus
      }
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '訂單 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無訂單資訊'
      })
    } else if (error.name === 'ValidationError') {
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
