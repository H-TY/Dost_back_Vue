import validator from 'validator'
import Muser from '../models/user.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'

export const create = async (req, res) => {
  try {
    await Muser.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'ValidationError') {
      console.log('error.name1', error.name)
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message

      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      console.log('error.name2', error.name)
      console.log('error.code', error.code)
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '帳號已註冊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

export const login = async (req, res) => {
  try {
    // 簽署新 token
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token) // 這邊的 tokens 指的是 models/user.js 所定義資料結構的 tokens
    await req.user.save() // 儲存進 DB 資料庫裡
    // console.log(req.user)
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      // 回傳前端所需要"顯示的資訊"
      result: {
        token,
        account: req.user.account,
        image: req.user.image,
        accountBgImage: req.user.accountBgImage,
        role: req.user.role,
        cart: req.user.cartHave
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

// 用來 token 舊換新
export const extend = async (req, res) => {
  try {
    // 找到索引 idx（用來找出 token 在陣列中的第幾個）
    // 判斷方式：找出 token 是不是等於 "現在的 token"
    const idx = req.user.tokens.findIndex(token => token === req.token)
    // 簽署新的 token
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    // 將原本使用者的 token 賦值 "新的 token"(換成新的 token)
    req.user.tokens[idx] = token
    // 儲存進 DB 資料庫裡
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// profile 向前端取自己的資料用
// 需要用 token 來取資料（使用者在登入之後，將 token 儲存在 local storage）
// 將前端需要的東西回傳即可
// 不需要用 asycn，使用者資料已經在 req 裡了
export const profile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        // 在 login 時，有回傳前端所需的資料 account、role、cart，這邊也一樣比照辦理
        // token 已經在前端了，故這邊不需要再回傳一次
        account: req.user.account,
        image: req.user.image,
        accountBgImage: req.user.accountBgImage,
        role: req.user.role,
        cart: req.user.cartHave
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 使用者編輯自己的資料
export const edit = async (req, res) => {
  // 若直接採用 req.user._id 輸出的值是 new ObjectId('66f6821663dbffffd0dcf98d')，並非"文字串/字符"，是 ObjectId 物件
  // .toString() 轉成文字即可取到 66f6821663dbffffd0dcf98d
  // console.log('req.user._id', req.user._id.toString())
  // 因有複數欄位需上傳檔案，故在 middlewares/upload.js 轉換資料時，有個別的欄位名稱，故陣列名稱為 req.files
  // req.files 輸出陣列為 ↓
  // req.files[Object: null prototype] {
  //   accountBgImage: [
  //     {
  //       fieldname: 'accountBgImage',
  //       originalname: 'userPhoto03.jpg',
  //       encoding: '7bit',
  //       mimetype: 'image/jpeg',
  //       path: 'https://res.cloudinary.com/dt10ltmkh/image/upload/v1727970646/kzasf1vcnorz0hebaxan.jpg',
  //       size: 42888,
  //       filename: 'kzasf1vcnorz0hebaxan'
  //     }
  //   ]
  // }
  // 從 req.files 解構出 image, accountBgImage
  const { image, accountBgImage } = req.files
  // console.log('image', image)
  // console.log('accountBgImage', accountBgImage)
  // console.log('accountBgImage?.[0].path', accountBgImage?.[0].path)
  // console.log('req.body', req.body)

  try {
    if (!validator.isMongoId(req.user._id.toString())) throw new Error('ID')

    // 有上傳實體圖片（經 middlewares/upload.js 轉換過的資料） req.file?.path
    // 恢復預設圖片（沒有上傳實體圖片，只有網址） req.body.image
    req.body.image = image?.[0].path || req.body.image
    req.body.accountBgImage = accountBgImage?.[0].path || req.body.accountBgImage

    // 設置 new: true 返回更新後的使用者資料
    const userUpdate = await Muser.findByIdAndUpdate(req.user._id.toString(), req.body, { runValidators: true, new: true }).orFail(new Error('NOT FOUND'))
    // console.log('userUpdate.image', userUpdate.image)
    // console.log('userUpdate.accountBgImage', userUpdate.accountBgImage)

    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        image: userUpdate.image,
        accountBgImage: userUpdate.accountBgImage
      }
    })
  } catch (error) {
    console.log(error)
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '使用者 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無使用者資訊'
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

export const logout = async (req, res) => {
  try {
    // 將"現在用來登入的 token"，從使用者資料（tokens:[有多筆 token]）的陣列中移除
    // 過濾出"不符合的 token"形成新的陣列 tokens，再用賦值的方式替換掉原來的 tokens，也就等於刪除掉 "符合的 token"
    req.user.tokens = req.user.tokens.filter(token => token !== req.token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
