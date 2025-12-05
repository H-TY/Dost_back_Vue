import multer from 'multer'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'
import { StatusCodes } from 'http-status-codes'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
})

// 處理要上傳的檔案
const fileupload = multer({
  storage: new CloudinaryStorage({
    cloudinary,
    params: async (req) => {
      const fromCP = req.body.fromCP // 用來判斷上傳的圖片是儲存在 cloudinary 網站的哪一個資料夾
      // console.log('fromCP', fromCP)

      if (fromCP === 'userPhoto') {
        return {
          folder: 'DOST/user_photo' // 在 cloudinary 網站設有專案用的上傳資料夾 DOST(裡面還有子資料夾)
        }
      } else if (fromCP === 'userAccountBg') {
        return {
          folder: 'DOST/user_bg'
        }
      } else {
        return {
          folder: 'DOST/dog_img'
        }
      }
    },
    format: 'avif' // 圖片轉換成 avif 檔，並以此檔案格式儲存進 cloudinary
  }),
  fileFilter (req, file, callback) {
    if (['image/jpg', 'image/jpeg', 'image/png', 'image/avif'].includes(file.mimetype)) {
      callback(null, true)
    } else {
      callback(new Error('FORMAT'), false)
    }
  },
  limits: {
    fieldSize: 1024 * 1024
  }
})

export default (req, res, next) => {
  // .fields([{欄位名稱, 單次上傳最大檔案數量}])處理多個不同欄位的檔案上傳
  fileupload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'accountBgImage', maxCount: 1 }
  ])(req, res, error => {
    if (error instanceof multer.MulterError) {
      let message = '上傳錯誤'
      if (error.code === 'LIMIT_FILE_SIZE') {
        message = '檔案太大'
      }
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error) {
      if (error.message === 'FORMAT') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '檔案格式錯誤'
        })
      } else {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
      }
    } else {
      next()
    }
  })
}
