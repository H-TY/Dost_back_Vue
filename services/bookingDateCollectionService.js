import MbookingDateCollectionData from '../models/bookingDateCollection.js';

// 建立預約日期列表的資料
export const createBDC = async (value) => {
	try {
		// ● 將檔案新增進 BD 資料庫
		// .create() 「單筆資料建立」的語法
		// .insertMany() 「一次新增多筆資料」的語法
		const result = await MbookingDateCollectionData.insertMany(value);
		// console.log('bookingDateCollectionData_creat_result', result);

		return result;
	} catch (error) {
		console.log('createBDC_error', error);
		throw new Error('建立預約日期列表失敗');
	}
};
