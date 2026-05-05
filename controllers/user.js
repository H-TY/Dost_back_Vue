import validator from 'validator';
import Muser from '../models/user.js';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

// ● 創建帳號
export const create = async (req, res) => {
	try {
		await Muser.create(req.body);
		res.status(StatusCodes.OK).json({
			success: true,
			message: ''
		});
	} catch (error) {
		console.log(error);
		if (error.name === 'ValidationError') {
			console.log('error.name1', error.name);
			const key = Object.keys(error.errors)[0];
			const message = error.errors[key].message;

			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message
			});
		} else if (error.name === 'MongoServerError' && error.code === 11000) {
			console.log('error.name2', error.name);
			console.log('error.code', error.code);
			res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: '帳號已註冊'
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '未知錯誤'
			});
		}
	}
};

// ● 登入動作
export const login = async (req, res) => {
	try {
		// ● 簽署新 token
		// 這邊的 tokens 指的是 models/user.js 所定義資料結構的 tokens
		const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' });
		req.user.tokens.push(token);

		// ● 儲存進 DB 資料庫裡
		await req.user.save();
		// console.log(req.user);

		// ● 制定要回傳前端的資料
		res.status(StatusCodes.OK).json({
			success: true,
			message: '',
			// 回傳前端所需要"顯示的資訊"
			result: {
				token,
				id: req.user._id,
				account: req.user.account,
				image: req.user.image,
				accountBgImage: req.user.accountBgImage,
				nickname: req.user.nickname,
				phone: req.user.phone,
				birthday: req.user.birthday,
				email: req.user.email,
				role: req.user.role,
				cart: req.user.cartHave
			}
		});
	} catch (error) {
		console.log(error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '未知錯誤'
		});
	}
};

// ● 用來 token 舊換新
export const extend = async (req, res) => {
	try {
		// 找到索引 idx（用來找出 token 在陣列中的第幾個）
		// 判斷方式：找出 token 是不是等於 "現在的 token"
		const idx = req.user.tokens.findIndex((token) => token === req.token);
		// 簽署新的 token
		const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' });
		// 將原本使用者的 token 賦值 "新的 token"(換成新的 token)
		req.user.tokens[idx] = token;
		// 儲存進 DB 資料庫裡
		await req.user.save();
		res.status(StatusCodes.OK).json({
			success: true,
			message: '',
			result: token
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '未知錯誤'
		});
	}
};

// ● profile 前端向後端請求資料
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
				id: req.user._id,
				account: req.user.account,
				image: req.user.image,
				accountBgImage: req.user.accountBgImage,
				nickname: req.user.nickname,
				phone: req.user.phone,
				birthday: req.user.birthday,
				email: req.user.email,
				role: req.user.role,
				cart: req.user.cartHave
			}
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '未知錯誤'
		});
	}
};

// ● 使用者編輯自己的資料並更新資料庫
export const edit = async (req, res) => {
	// console.log('edit_req.body', req.body);

	// 取前端放在 URL 路徑（path param）裡的 id 值
	const userID = req.params.id;
	// console.log('edit_userID', userID);

	// 從 req.files 解構出 image, accountBgImage
	const { image, accountBgImage } = req.files;
	// console.log('image', image)
	// console.log('accountBgImage', accountBgImage)
	// console.log('accountBgImage?.[0].path', accountBgImage?.[0].path)
	// console.log('req.body', req.body)

	try {
		if (!validator.isMongoId(userID)) throw new Error('ID');

		// 有上傳實體圖片（經 middlewares/upload.js 轉換過的資料） req.file?.path
		// 恢復預設圖片（沒有上傳實體圖片，只有網址） req.body.image
		req.body.image = image?.[0].path || req.body.image;
		req.body.accountBgImage = accountBgImage?.[0].path || req.body.accountBgImage;

		// 設置 new: true 返回更新後的使用者資料
		const userUpdate = await Muser.findByIdAndUpdate(userID, req.body, { runValidators: true, new: true }).orFail(new Error('NOT FOUND'));
		// console.log('userUpdate', userUpdate);
		// console.log('userUpdate.image', userUpdate.image)
		// console.log('userUpdate.accountBgImage', userUpdate.accountBgImage)

		res.status(StatusCodes.OK).json({
			success: true,
			message: '',
			result: {
				userUpdate, // 回傳給前端更新後的資料，
				renewUserItem: req.body.fromCP // 回傳給前端的資料，告知是更新使用者頭像還是背景圖片
			}
		});
	} catch (error) {
		console.log(error);
		if (error.name === 'CastError' || error.message === 'ID') {
			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: '使用者 ID 格式錯誤'
			});
		} else if (error.message === 'NOT FOUND') {
			res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: '查無使用者資訊'
			});
		} else if (error.name === 'ValidationError') {
			const key = Object.keys(error.errors)[0];
			const message = error.errors[key].message;
			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '未知錯誤'
			});
		}
	}
};

// ● 登出動作
export const logout = async (req, res) => {
	try {
		// 將"現在用來登入的 token"，從使用者資料（tokens:[有多筆 token]）的陣列中移除
		// 過濾出"不符合的 token"形成新的陣列 tokens，再用賦值的方式替換掉原來的 tokens，也就等於刪除掉 "符合的 token"
		req.user.tokens = req.user.tokens.filter((token) => token !== req.token);
		await req.user.save();
		res.status(StatusCodes.OK).json({
			success: true,
			message: ''
		});
	} catch (error) {
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '未知錯誤'
		});
	}
};
