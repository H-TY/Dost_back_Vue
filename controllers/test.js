import validator from 'validator'
import MbookingOrderData from '../models/bookingOrder.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
  try {
    // console.log('Request Body1:', req.body)

    // 利用前端傳進來的當天日期，找尋訂單資料庫有沒有當日的最新訂單
    const regex = new RegExp(req.query.reNowDate, 'i')
    const data = await MbookingOrderData.find({ bookingOrderNumber: regex })
    // console.log('data:', data)

    // 找出後端訂單資料庫最新的訂單編號
    // 若資料庫回傳 data：［ ］ 空陣列，代表當日尚未建立訂單；可用長度 data.length === 0 來判斷，回傳當天日期並加上流水號 '001'
    // 若有資料可以抓取，用 .map() 抓出所有的 bookingOrderNumber 的值，組成新的陣列
    // Number() 將資料類型轉成"數字類型"
    // Math.max() 找出最大值，只能用數字做比較，且無法用於陣列，故需用 ... 將陣列展開
    // 資料類型須為文字/字符/字符串.padStart(2, '0') 用零補足至 2 位數
    // .padEnd(number.toString().length + 3, '0') 在數字後自動補 3 個零，第一個參數計算出字串長度再加上要補零的位數
    const maxBookingOrderNumber = () => {
      if (data.length === 0) {
        // 搜尋後無當天訂單資料時，回傳前端當天日期數字+001 開始計算流水號
        return req.query.reNowDate + '001'
      } else {
        // 若有抓到最新訂單編號，則最新編號 +1，並轉成符合資料庫可接受的文字資料類型
        return (Math.max(...data.map(el => Number(el.bookingOrderNumber))) + 1).toString()
      }
    }

    // 宣告訂單編號
    // 執行上述函式 maxBookingOrderNumber() 建立最新的訂單編號
    const bookingOrderNumber = maxBookingOrderNumber()
    // 因 req.body 被設置為 [Object: null prototype] 的物件類型，可以用 Object.assign(A, B) 將 B 合併進 A物件
    // 將宣告的變數用大括號 {} 包住，就會視為物件
    Object.assign(req.body, { bookingOrderNumber })
    // console.log('Request Body2:', req.body)

    const result = await MbookingOrderData.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '預約成功',
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
    // 若 req.query.search 為前端傳來的參數，資料型態應為文字/文字串，若為 '' 空值，表示要搜尋所有資料並回傳前端
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

// ● 計算訂單量最多的狗狗
export const topOrder = async (req, res, next) => {
  try {
    // console.log('req.body', req.body)
    const result = await req.body
    // console.log('result', result)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    console.log('error', error)
  }
}
