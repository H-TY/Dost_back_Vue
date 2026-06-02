import validator from 'validator';
import MbookingDateCollectionData from '../models/bookingDateCollection.js';
import { StatusCodes } from 'http-status-codes';

// 資料庫建檔
export const create = async (req, res) => {
	try {
		const data = req.body;
		// console.log('bookingDateCollectionData_creat_data', data);

		// ● 將檔案新增進 BD 資料庫
		// .create() 「單筆資料建立」的語法
		// .insertMany() 「一次新增多筆資料」的語法
		const result = await MbookingDateCollectionData.insertMany(data);
		// console.log('bookingDateCollectionData_creat_result', result);

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
		// const data = req.body;
		// console.log('bookingDateCollectionData_get_data', data);

		const dogId = req.query.dogId;
		const YearMonth = req.query.dateYM;
		// console.log('dogId', dogId);
		// console.log('YearMonth', YearMonth);

		const regexYearMonth = new RegExp(YearMonth);

		const result = await MbookingDateCollectionData.find({
			dogId,
			bookingDate: regexYearMonth
		});
		// console.log('result', result);

		if (result.length === 0) {
			res.status(StatusCodes.OK).json({
				success: true,
				message: '資料庫無資料！',
				result
			});
		} else {
			res.status(StatusCodes.OK).json({
				success: true,
				message: '已成功抓取到資料',
				result
			});
		}
	} catch (error) {
		console.log('bookingDateCollectionData_get_ERROR', error);
	}
};

// 刪除預約時段資料（依據已取消訂單）
export const deleteData = async (req, res) => {
	try {
		const data = req.body;
		// console.log('bookingDateCollectionData_deleteData_data', data);

		// 刪除多筆資料，使用 deleteMany() 方法，並使用 $or 條件來匹配多個條件
		const result = await MbookingDateCollectionData.deleteMany({
			$or: data.map((el) => ({
				dogId: el.dogId,
				bookingDate: el.bookingDate,
				bookingTime: el.bookingTime
			}))
		});

		// console.log('bookingDateCollectionData_deleteData_result', result);

		if (result.deletedCount === 0) {
			res.status(StatusCodes.OK).json({
				success: true,
				message: '資料庫無符合條件的資料可刪除！'
			});
		} else {
			res.status(StatusCodes.OK).json({
				success: true,
				message: '已成功刪除預約時段資料',
				result
			});
		}
	} catch (error) {
		console.log('bookingDateCollectionData_deleteData_ERROR', error);
	}
};
