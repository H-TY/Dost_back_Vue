import validator from 'validator';
import MbookingDateCollectionData from '../models/bookingDateCollection.js';
import { StatusCodes } from 'http-status-codes';

export const create = async (req, res) => {
	try {
		const data = req.body;
		console.log('bookingDateCollectionData_creat_data', data);

		// ● 將檔案新增進 BD 資料庫
		const result = await MbookingDateCollectionData.create(data);

		res.status(StatusCodes.OK).json({
			success: true,
			message: '已成功在資料庫建檔 bookingDateCollection',
			result
		});
	} catch (error) {
		console.log('bookingDateCollectionData_creat_ERROR', error);

		if (error.name === 'ValidationError') {
			const key = Object.keys(error.errors)[0];
			const message = error.errors[key].message;

			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '新建 bookingDateCollection 存入資料庫時，發生未知錯誤'
			});
		}
	}
};

// 查詢資料庫
export const get = async (req, res) => {
	try {
		const data = req.body;
		console.log('bookingDateCollectionData_get_data', data);
	} catch (error) {
		console.log('bookingDateCollectionData_get_ERROR', error);
	}
};

// 更新資料庫
export const update = async (req, res) => {
	try {
		const data = req.body;
		console.log('bookingDateCollectionData_update_data', data);
	} catch (error) {
		console.log('bookingDateCollectionData_update_ERROR', error);
	}
};
