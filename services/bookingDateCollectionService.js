import MbookingDateCollectionData from '../models/bookingDateCollection.js';

// ● 建立預約日期列表的資料
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

// ● 刪除預約時段資料（依據已取消訂單）
export const deleteBDC = async (value) => {
	try {
		// 設定要回傳的訊息
		let text = '';

		// 刪除多筆資料，使用 deleteMany() 方法，並使用 $or 條件來匹配多個條件
		const result = await MbookingDateCollectionData.deleteMany({
			$or: value.map((el) => ({
				dogId: el.dogId,
				bookingDate: el.bookingDate,
				bookingTime: el.bookingTime
			}))
		});

		// 刪除的資料的總數量
		const deleteQuantity = result.deletedCount;

		if (deleteQuantity === 0) {
			text = '資料庫無符合條件的資料可刪除！';
		} else {
			text = '資料庫已成功刪除預約時段資料';
		}

		return text;
	} catch (error) {
		console.log('deleteBDC_error', error);
		throw new Error('刪除指定預約日期列表失敗');
	}
};
