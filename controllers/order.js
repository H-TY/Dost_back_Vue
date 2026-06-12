// Controller 的主要責任（總結：接收、驗證、呼叫 Service、回應）
// 1. 接收前端請求：
// 從前端收到資料，例如 POST 的表單資料、GET 的查詢參數、PUT 或 DELETE 的更新/刪除資訊。
// 2. 驗證資料格式（也可以放到 middleware 做）：
// 例如檢查前端送過來的欄位是否完整、型別是否正確。
// 3. 呼叫業務邏輯 / Service 層（簡單的邏輯可以直接放 controller）：
// Controller 本身不直接寫複雜邏輯，通常會把核心運算/計算、資料整合、資料庫操作交給 service 或 model。
// 4. 回應前端資料：
// 將運算或資料庫回傳的結果整理成 API 回應（JSON、XML、HTML等）。

import validator from 'validator';
import MbookingOrderData from '../models/bookingOrder.js';
import MbookingDateCollectionData from '../models/bookingDateCollection.js';
import {
	checkDuplicateBooking,
	generateBookingOrderNumber,
	calculateTotalBookingTime,
	calculateTotalBookingPrice,
	calculateTopThreeOrder
} from '../services/orderService.js';
import { createBDC, deleteBDC } from '../services/bookingDateCollectionService.js';
import { StatusCodes } from 'http-status-codes';

export const create = async (req, res) => {
	try {
		const data = req.body;
		// console.log('controllers_order_create_data:', data);

		// 從前端 params 傳入的關鍵字
		const date = req.query.orderDate;
		// console.log('date:', date);
		const dogId = req.query.dogId;
		// console.log('dogId:', dogId);
		const dogName = data.dogName;
		const bookingDate = data.bookingDate;
		const bookingTime = data.bookingTime;

		// 取年、月，提供後續查詢
		const dateYM = bookingDate.split('/').slice(0, 2).join('/');
		// console.log('dateYM', dateYM);

		// ● 檢查是否有重複預約
		const isDuplicate = await checkDuplicateBooking(dogId, dateYM, bookingDate, bookingTime);

		if (isDuplicate) {
			const error = new Error('日期或時段已經被預約，請刷新頁面後重新選擇');
			error.statusCode = 400;
			throw error;
		}

		// ● 生成訂單編號
		// 因函式裡有使用到 async，故在呼叫函式時也要用到 await
		// async 函式的本質是什麼？一定回傳 Promise，故要使用 await 取到值
		const bookingOrderNumber = await generateBookingOrderNumber(data, date);
		// console.log('bookingOrderNumber:', bookingOrderNumber);

		// ● 計算訂單總時數
		const totalBookingTime = await calculateTotalBookingTime(data);
		// console.log('totalBookingTime:', totalBookingTime);

		// ● 計算訂單總金額
		const totalPrice = await calculateTotalBookingPrice(data, dogId, totalBookingTime);
		// console.log('totalPrice:', totalPrice);

		// 將上面的計算結果（訂單編號、總時數、總金額）併入 req.body
		// 因 req.body 被設置為 [Object: null prototype] 的物件類型，可以用 Object.assign(A, B) 將 B 合併進 A物件
		// 將宣告的變數用大括號 {} 包住，就會視為物件
		// 當「屬性名稱 key」和「變數名稱」一樣時，JS 允許省略/簡寫。
		// 完整寫法：
		// Object.assign(data,{
		// 									bookingOrderNumber: bookingOrderNumber,
		// 									totalBookingTime: totalBookingTime
		// 									});

		Object.assign(data, { bookingOrderNumber, totalBookingTime, totalPrice });
		// console.log('combin-data:', data);

		// ● 建立訂單檔案
		// 將檔案新增進 BD 資料庫 modelsName.create()
		const result = await MbookingOrderData.create(data);

		// ★★★ 整理要建立的預約日期資料，方便日後查詢哪一些日期已預約
		const handleData = bookingTime.map((el) => ({
			dogId,
			dogName,
			bookingDate,
			bookingTime: el
		}));

		// ★★★ 在後端資料庫建立預約時間列表的資料
		const addBCD = await createBDC(handleData);
		// console.log('addBCD:', addBCD);

		// ★★★ 查詢最新預約時間列表的資料，回傳給前端更新日期選擇器
		const regexYearMonth = new RegExp(dateYM);
		const resultBCD = await MbookingDateCollectionData.find({
			dogId,
			bookingDate: regexYearMonth
		});
		// console.log('resultBCD:', resultBCD);

		res.status(StatusCodes.OK).json({
			success: true,
			message: '預約成功',
			result,
			resultBCD
		});
	} catch (error) {
		console.log(error);
		if (error.name === 'ValidationError') {
			const key = Object.keys(error.errors)[0];
			const message = error.errors[key].message;

			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message
			});
		} else if (error.statusCode) {
			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: error.message
			});
		} else {
			res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
				success: false,
				message: '新建訂單存入資料庫時，發生未知錯誤'
			});
		}
	}
};

export const getAll = async (req, res) => {
	try {
		// 檢查是否有從前端傳入值 ↓
		// console.log('req.query.search', req.query.search)
		const sortBy = req.query.sortBy || 'bookingOrderNumber';
		const sortOrder = req.query.sortOrder || 'desc';

		// 從前端傳入要搜尋的值，再藉由值找到相對應的資料後，利用 regex 正則表達式將相關資料一併找出回傳前端
		// 正則表達式主要用於搜尋 "文字/字串" 資料類型，可以搜尋部分符合的資料
		// 正則表達式主要用於搜尋 "文字/字串" 資料類型
		// 若 req.query.search 是 '' 空值，表示要搜尋並回傳前端所有資料
		const regex = new RegExp(req.query.search || '', 'i');
		const data = await MbookingOrderData
			// 搜尋功能，採用上述的 regex 的參數做關鍵字搜尋
			.find({
				// $or 表示符合其中一個條件即可
				// 給的參數要能做正則表達式，假若用 _id 會失敗，會直接以 _id 去搜尋
				// 如果要用 _id 搜尋資料，須提供的是 24 字符的十六进制字符串（比如 "507f1f77bcf86cd799439011"）
				// const id = new ObjectId('507f1f77bcf86cd799439011')
				$or: [{ name: regex }, { feature: regex }]
			})
			.sort({ [sortBy]: sortOrder });

		const total = await MbookingOrderData.estimatedDocumentCount();
		res.status(StatusCodes.OK).json({
			success: true,
			message: '',
			result: {
				data,
				total
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

export const get = async (req, res) => {
	try {
		// console.log('get_req.query.search', req.query.search)
		// console.log(typeof (req.query.search))

		// 設定要排序的欄位名稱
		// 因沒有從前端傳入 req.query.sortBy，故會採用 'bookingOrderNumber'
		const sortBy = req.query.sortBy || 'bookingOrderNumber';
		// 設定要排序的方式：asc 升冪（由小至大排序）；desc 降冪（由大至小排序）
		// 因沒有從前端傳入 req.query.sortOrder，故會採用 'desc'
		const sortOrder = req.query.sortOrder || 'desc';

		// 因有要找到指定的相關資料，故從前端傳入要搜尋的值（req.query.search＝User.value）↓
		// const { data } = await apiAuth.get('/order',{
		//   params: {
		//     search: User.value
		//   }
		// })
		// 再藉由值找到相對應的資料後，利用 regex 正則表達式將相關資料一併找出回傳前端
		// 正則表達式主要用於搜尋 "文字/字串" 資料類型，可以搜尋部分符合的資料
		// 欄位的資料格式需確保為 "文字/字串" 類型，正則表達式才有作用
		// 若 req.query.search 為前端傳來的參數，資料型態應為文字/文字串，若為 '' 空值，表示要搜尋所有資料並回傳前端
		const regex = new RegExp(req.query.search || '', 'i');
		const data = await MbookingOrderData
			// 搜尋功能，採用上述的 regex 的參數做關鍵字搜尋
			.find({
				// $or 符合其中一個條件即可
				$or: [{ bookingOrderNumber: regex }, { accountName: regex }]
			})
			// 將搜尋出來的資料做排序，可視為預先排序，當使用者開啟頁面即可看到預先排序過的資料
			// 這邊設定以 bookingOrderNumber 做 desc 降冪排序
			.sort({ [sortBy]: sortOrder });

		const total = await MbookingOrderData.estimatedDocumentCount();
		res.status(StatusCodes.OK).json({
			success: true,
			message: '',
			result: {
				data,
				total
			}
		});
		// console.log('data', data, 'total', total)
	} catch (error) {
		console.log(error);
		res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
			success: false,
			message: '未知錯誤'
		});
	}
};

export const edit = async (req, res) => {
	try {
		// const data = req.body;
		// console.log('controllers_order_edit_data:', data);

		// console.log('req.params.id', req.params.id)
		if (!validator.isMongoId(req.params.id)) throw new Error('ID');

		// .findByIdAndUpdate 搜尋並更新
		// 需先通過驗證 { runValidators: true }，再將 req.params.id 作為搜尋關鍵詞，更新相對 id 的 req.body，若失敗則拋出錯誤
		// 設置 new: true 返回更新後的使用者資料
		const userUpdate = await MbookingOrderData.findByIdAndUpdate(req.params.id, req.body, { runValidators: true, new: true }).orFail(new Error('NOT FOUND'));
		// console.log('userUpdate', userUpdate);

		// 設定資料庫刪除完資料後要回傳的訊息
		let BDtext = '';

		// ★★★ 因為取消訂單，故一併後端資料庫的預約日期列表也須更新
		if (!userUpdate.orderStatus) {
			// 整理要刪除的預約日期資料，因 bookingTime 為陣列型態的資料可能有多個值，需整理成一筆資料、一個陣列、一個值，方便後續資料庫的操作
			const handleData = userUpdate.bookingTime.map((el) => {
				return {
					dogId: userUpdate.dogId,
					bookingDate: userUpdate.bookingDate,
					bookingTime: el
				};
			});

			// ★★★ 資料庫刪除指定的預約時間列表的資料
			const deleteBCD = await deleteBDC(handleData);
			// console.log('deleteBCD:', deleteBCD);

			BDtext = deleteBCD;
		}

		res.status(StatusCodes.OK).json({
			success: true,
			message: '',
			BDtext,
			userUpdate
		});
	} catch (error) {
		console.log('error：', error);
		if (error.name === 'CastError' || error.message === 'ID') {
			res.status(StatusCodes.BAD_REQUEST).json({
				success: false,
				message: '訂單 ID 格式錯誤'
			});
		} else if (error.message === 'NOT FOUND') {
			res.status(StatusCodes.NOT_FOUND).json({
				success: false,
				message: '查無訂單資訊'
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

// ● 計算訂單量最多的狗狗
export const topOrder = async (req, res) => {
	try {
		const data = req.body;
		// console.log('data:', data);

		const date = req.query.date;
		// console.log('date:', date);

		const topThreeOrder = await calculateTopThreeOrder(date);
		// console.log('topThreeOrder', topThreeOrder);

		const result = topThreeOrder;
		// console.log('result', result)

		res.status(StatusCodes.OK).json({
			success: true,
			message: '',
			result
		});
	} catch (error) {
		console.log('error', error);
	}
};
