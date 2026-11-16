import MbookingDateCollectionData from '../models/bookingDateCollection.js';
import { StatusCodes } from 'http-status-codes';

// ● 建立預約日期列表的資料
// session 參數是為了讓此函式可以被 Transaction 交易功能使用，若沒有這個參數，則無法同時成功或同時失敗
export const createBDC = async (value, session) => {
	try {
		// console.log('createBDC_value', value);
		// console.log('createBDC_value&session', value, session);

		// ● 測試錯誤處理，故意丟出錯誤
		// ➣ 簡單丟出錯誤訊息：
		// throw new Error('createBDC 測試錯誤處理');
		// ➣ 開發者自定義 Developer-defined（縮寫 DD）丟出的錯誤訊息：
		// const DDerror = new Error('createBDC 自訂錯誤訊息');
		// DDerror.name = 'createBDC 測試錯誤';
		// DDerror.statusCode = 12345;
		// throw DDerror;
		// ※ 小知識：使用者自定義 User-defined（縮寫 UD）
		// ➣ 觸發重複訂單情境：
		// const duplicateOrder = [
		// 	{
		// 		dogId: '69d79a16434c03cbca9dfde2',
		// 		dogName: '小黑',
		// 		bookingDate: '2026/11/27',
		// 		bookingTime: '13:00～15:00'
		// 	},
		// 	{
		// 		dogId: '69d79a16434c03cbca9dfde2',
		// 		dogName: '小黑',
		// 		bookingDate: '2026/11/27',
		// 		bookingTime: '13:00～15:00'
		// 	}
		// ];
		// value = duplicateOrder;
		// console.log('passIN_value=duplicateOrder', value);

		// ● 將檔案新增進 BD 資料庫
		// .create() 「單筆資料建立」的語法
		// .insertMany() 「一次新增多筆資料」的語法
		// { session } 表示將此資料庫操作列入所屬/指定的交易 Session，確保該操作納入交易管理，與交易中的其他資料庫操作共同提交或回滾，若某一資料庫操作失敗/錯誤，此交易 Session 的所有操作過的資料回復至交易前的資料狀態（也就是回滾）。
		const result = await MbookingDateCollectionData.insertMany(value, { session });
		// console.log('bookingDateCollectionData_creat_result', result);

		return result;
	} catch (error) {
		console.log('createBDC_error', error);

		if (error.code === 11000) {
			const UDerror = new Error('此日期或時段已被預約，請重新整理頁面');
			UDerror.statusCode = StatusCodes.CONFLICT;
			throw UDerror;
		} else {
			throw error;
		}
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
