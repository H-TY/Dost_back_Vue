import validator from 'validator';
import MuserFavorite from '../models/userFavorite.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

// ● 設定動態欄位名 key
const fieldName = {
	dog: 'dogLike',
	product: 'productLike'
};

const resMsgTitle = (type) => {
	if (fieldName[type] === 'dogLike') {
		return '<<狗狗收藏>>';
	} else if (fieldName[type] === 'productLike') {
		return '<<追蹤商品>>';
	}
};

// ● 建立資料 / 添加資料
export const createAndadd = async (req, res) => {
	try {
		// ★★★ 手動觸發錯誤 ★★★
		// throw new Error('手動測試 400 錯誤');
		// throw new TypeError('手動測試 500 錯誤');
		// 因 error.name 不是 Error 而是 TypeError，故轉到 else 的條件，觸發 500 錯誤

		// 使用後端 token 解析出來的 user._id，防止前端惡意寫入
		const reqUserId = req.user._id;
		// console.log('reqUserId:', reqUserId);

		const data = req.body;
		// console.log('CT_userFav_createAndUpdate_data:', data);

		// ### 補充知識
		// .equals() MongoDB 官方寫法（推薦）在比較 new ObjectId() 的資料類型，會自動處理 ObjectId vs string
		// if (!reqUserId.equals(data.userId)) {
		// 	throw new Error('user id 不相等，停止將資料存入資料庫動作');
		// }

		// ● 防呆
		if (!fieldName[data.type]) {
			throw new Error('非 <<收藏狗狗/追蹤商品>> 的類型');
		}

		// ● 整理要存入的資料
		const fieldValue = {
			// fieldName[data.type] 是取值；但外面再加上 []，就會把它當作 key 來用
			[fieldName[data.type]]: data.id
		};

		const result = await MuserFavorite.findOneAndUpdate(
			{ userId: reqUserId },
			{
				$addToSet: fieldValue,
				$setOnInsert: { userId: reqUserId }
			},
			{ upsert: true, new: true }
		);

		// ● 回傳前端資訊
		res.status(StatusCodes.OK).json({
			success: true,
			message: `成功加入 ${resMsgTitle(data.type)}`,
			result
		});
	} catch (error) {
		console.log({
			CUFCE_name: error.name,
			CUFCE_message: error.message,
			CUFCE_code: error.code,
			CUFCE_response: error.response,
			CUFCE_request: error.request
		});

		if (error.name === 'Error') {
			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: error.message
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '儲存 <<收藏狗狗/追蹤商品>> 資料時，發生未知錯誤'
			});
		}
	}
};

// ● 移除資料
export const remove = async (req, res) => {
	try {
		// ★★★ 手動觸發錯誤 ★★★
		// throw new Error('手動測試 400 錯誤');
		// throw new TypeError('手動測試 500 錯誤');

		const reqUserId = req.user._id;
		// console.log('reqUserId:', reqUserId);

		const data = req.body;
		// console.log('CT_userFav_remove_data:', data);

		if (!fieldName[data.type]) {
			throw new Error('非 <<收藏狗狗/追蹤商品>> 的類型');
		}

		const fieldValue = {
			[fieldName[data.type]]: data.id
		};

		const result = await MuserFavorite.findOneAndUpdate(
			{ userId: reqUserId },
			{
				$pull: fieldValue
			},
			{ new: true }
		);

		// ● 回傳前端資訊
		res.status(StatusCodes.OK).json({
			success: true,
			message: `成功從 ${resMsgTitle(data.type)} 中移除`,
			result
		});
	} catch (error) {
		console.log({
			CUFCE_name: error.name,
			CUFCE_message: error.message,
			CUFCE_code: error.code,
			CUFCE_response: error.response,
			CUFCE_request: error.request
		});

		if (error.name === 'Error') {
			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: error.message
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '從 <<收藏狗狗/追蹤商品>> 移除指定資料時，發生未知錯誤'
			});
		}
	}
};

// ● 查詢資料
export const profile = async (req, res) => {
	try {
		const resUserId = req.user._id;

		const result = await MuserFavorite.findOne({ userId: resUserId });
		// console.log('CT_userFavorite_profile_result:', result);

		// ● 回傳前端資訊
		if (!result) {
			res.status(StatusCodes.OK).json({
				success: false,
				message: '使用者尚未建立 <<收藏狗狗/追蹤商品>> 相關資料',
				result: []
			});
		} else {
			res.status(StatusCodes.OK).json({
				success: true,
				message: '成功取得 <<收藏狗狗/追蹤商品>> 資料',
				result
			});
		}
	} catch (error) {
		console.log('CT_userFavorite_get_error', error);

		if (error.name === 'Error') {
			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: error.message
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '搜取 <<收藏狗狗/追蹤商品>> 資料時，發生未知錯誤'
			});
		}
	}
};

// ● 修改資料
export const allUpdata = async (req, res) => {
	try {
	} catch (error) {
		console.log('CT_userFavorite_edit_error', error);
	}
};
