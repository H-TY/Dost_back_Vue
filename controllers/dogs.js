import validator from 'validator'
import MdogsData from '../models/dogsData.js'
import { StatusCodes } from 'http-status-codes'

export const create = async (req, res) => {
  try {
    // 先取出圖片，目前圖片位置在 req.file.path
    req.body.image = req.file.path
    const result = await MdogsData.create(req.body)
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

// 管理者可以看到全部的狗狗資訊(含下架)
export const getAll = async (req, res) => {
  try {
    // 前面東西沒有的時候，使用後面的預設值 createdAt
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const itemsPerPage = req.query.itemsPerPage * 1 || 10
    const page = req.query.page * 1 || 1
    // 用正則表達式處理搜尋文字以及 i 不分大小寫
    // g 全域；i 不分大小寫
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await MdogsData
      // 搜尋功能，採用上述的 regex 做參數
      .find({
        // $or 符合其中一個條件即可
        $or: [
          { dogName: regex }, // 狗狗名字要符合正則表達式
          { feature: regex }]
      })
      // 排序功能，依照 sortBy('createdAt') 的資料，做 sortOrder('desc') 升冪排序要回傳的資料
      // const text = 'a'
      // const obj = { [text]: 1 }
      // 變數要用 []
      // obj.a --> 1
      .sort({ [sortBy]: sortOrder })
      // Mongo DB 在分頁的處理方式，用 .skip()跳過幾筆資料 和 .limit()回傳幾筆資料
      // 如果一頁有 10 筆
      // 第一頁 = 1 ~ 10 = 跳過 0 筆 = (第 1 頁 - 1) * 10 = 0
      // 第二頁 = 11 ~ 20 = 跳過 10 筆 = (第 2 頁 - 1) * 10 = 10
      // 第三頁 = 21 ~ 30 = 跳過 20 筆 = (第 3 頁 - 1) * 10 = 20
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    const total = await MdogsData.estimatedDocumentCount()
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

export const edit = async (req, res) => {
  try {
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')
    // 這邊 file 的後面要接鏈結操作符 ?. 因為使用者可能沒有要更換圖片，這邊圖片沒有要求必須填寫
    req.body.image = req.file?.path
    // .findByIdAndUpdate 搜尋並更新
    // 需先通過驗證 { runValidators: true }，再將 req.params.id 作為搜尋關鍵詞，更新相對 id 的 req.body，若失敗則拋出錯誤
    await MdogsData.findByIdAndUpdate(req.params.id, req.body, { runValidators: true }).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '狗狗 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無狗狗資訊'
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

// 使用者只能看到有標註上架的狗狗資訊
export const get = async (req, res) => {
  try {
    // console.log(req.query.itemsPerPage)
    // 前面東西沒有的時候，使用後面的預設值 createdAt
    const sortBy = req.query.sortBy || 'createdAt'
    const sortOrder = req.query.sortOrder || 'desc'
    const itemsPerPage = req.query.itemsPerPage * 1 || 0
    const page = req.query.page * 1 || 1
    // 用正則表達式處理搜尋文字以及 i 不分大小寫
    // g 全域；i 不分大小寫
    const regex = new RegExp(req.query.search || '', 'i')

    const data = await MdogsData
      // 搜尋功能，採用上述的 regex 做參數
      .find({
        // 只看得到有表註上架的狗狗資訊
        sell: true,
        // $or 符合其中一個條件即可
        // regex 正則表達式只能應用於 "string 字符串/字串/文字" 類型
        $or: [
          { dogName: regex },
          { booking: regex }]
      })
      // 排序功能，依照 sortBy('createdAt') 的資料，做 sortOrder('desc') 升冪排序要回傳的資料
      // const text = 'a'
      // const obj = { [text]: 1 }
      // 變數要用 []
      // obj.a --> 1
      .sort({ [sortBy]: sortOrder })
      // Mongo DB 在分頁的處理方式，用 .skip()跳過幾筆資料 和 .limit()回傳幾筆資料
      // 如果一頁有 10 筆
      // 第一頁 = 1 ~ 10 = 跳過 0 筆 = (第 1 頁 - 1) * 10 = 0
      // 第二頁 = 11 ~ 20 = 跳過 10 筆 = (第 2 頁 - 1) * 10 = 10
      // 第三頁 = 21 ~ 30 = 跳過 20 筆 = (第 3 頁 - 1) * 10 = 20
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)

    const total = await MdogsData.estimatedDocumentCount()
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

// 查詢單個指定商品
export const getId = async (req, res) => {
  try {
    // console.log(req.params.id)
    if (!validator.isMongoId(req.params.id)) throw new Error('ID')

    const result = await MdogsData.findById(req.params.id).orFail(new Error('NOT FOUND'))

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '狗狗 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無狗狗資訊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}
