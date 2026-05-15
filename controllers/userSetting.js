import validator from 'validator';
import MuserSetting from '../models/userSetting.js';
import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

export const createAndUpdate = async (req, res) => {
	try {
		// // ★★★ 手動觸發 mongoDB 的驗證錯誤
		// const error = new mongoose.Error.ValidationError();
		// error.addError(
		// 	'name',
		// 	new mongoose.Error.ValidatorError({
		// 		message: '不可留白',
		// 		path: 'name',
		// 		value: ''
		// 	})
		// );
		// throw error;

		const data = req.body;
		// console.log('controllers_userSetting_create_data:', data);

		// ● 創建/更新資料進資料庫
		// .findOneAndUpdate(
		// 				{ 依據找尋的條件 },
		// 				{ 要設置/更新的資料 },
		// 				{ upsert 沒有找到符合條件的就創建資料，有就更新資料, new 回傳更新後資料 })
		// 說明：依據 userId 找尋資料庫是否有對應的資料，沒有就創建新資料；有就更新資料
		// 這邊要建立/更新的資料 { $set: data.settings }
		const result = await MuserSetting.findOneAndUpdate(
			{ userId: data.userId },
			{
				$set: { settings: data.settings },
				$setOnInsert: { userId: data.userId } // 只在「資料被建立（insert）」時，才會把 userId 寫進去，但是若為更新（update）動作，這段完全不會執行
			},
			{ upsert: true, new: true }
		);

		// ● 回傳前端資訊
		res.status(StatusCodes.OK).json({
			success: true,
			message: '已儲存設定',
			result
		});
	} catch (error) {
		// console.dir(object, options) 可以看到巢狀結構更深層的完整資料
		console.log('=== ERROR START ===');
		console.dir(error, { depth: null });
		console.log('=== ERROR END ===');

		console.log({
			CUCE_name: error.name,
			CUCE_message: error.message,
			CUCE_code: error.code,
			CUCE_response: error.response,
			CUCE_request: error.request
		});

		if (error.name === 'ValidationError') {
			// console.log('error.errors.name', error.errors.name);
			const msg = error.errors.name.message;
			// console.log('msg', msg);

			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: msg
			});
		} else if (error.name === 'MongoServerError' && error.code === 11000) {
			// ● 依據後端錯誤（MongoDB 回傳）判斷錯誤類型 → 再轉成 HTTP 回應給前端
			// 找出 "錯誤" 對應的 "語意狀態"（須查詢 StatusCodes 的語意狀態)
			// 在 res.status 設定對應的狀態碼 StatusCodes.CONFLICT （也就是 "資料衝突" = 代碼 409；為方便辨識，用語意取代代號）
			res.status(StatusCodes.CONFLICT).json({
				success: false,
				message: '使用者設定資料，重複創建'
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '儲存使用者設定時，發生未知錯誤'
			});
		}
	}
};

export const profile = async (req, res) => {
	try {
		const id = req.query.userId;
		// console.log('controllers_userSetting_profile_id:', id);

		const result = await MuserSetting.findOne({ userId: id });
		// console.log('從資料庫抓取資料:', result);

		// 當後端資料庫搜尋無資料，會回傳 null，這不會被歸類為 "錯誤"，所以不會在 catch (error) 那邊做回傳
		if (!result) {
			return res.status(StatusCodes.OK).json({
				success: false
			});
		}

		res.status(StatusCodes.OK).json({
			success: true,
			result
		});
	} catch (error) {
		console.log('=== ERROR START ===');
		console.dir(error, { depth: null });
		console.log('=== ERROR END ===');

		console.log({
			profile_name: error.name,
			profile_message: error.message,
			profile_code: error.code,
			profile_response: error.response,
			profile_request: error.request
		});

		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '未知錯誤'
		});
	}
};
