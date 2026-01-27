import MdogsData from '../models/dogsData.js';
import MorderSerialNumberList from '../models/orderSerialNumberList.js';

// ● 生成訂單編號
export const generateBookingOrderNumber = async (data, date) => {
	// console.log('data_OS', data);
	// console.log('date', date);

	// ● 避免當有大量訂單湧入時造成 "訂單編號重複"：
	// 1. 建立一個訂單流水號管理的檔案，紀錄流水號是今日第一個訂單或是最新訂單編號
	// 2. 使用 "原子操作（Atomic Operation）"：意思是「不可分割、一次完成的操作」，要麼完全成功，要麼完全不做，中間不會被其他操作打斷。
	// .findOneAndUpdate(
	//   filter,        // 找誰
	//   update,        // 要怎麼改，$inc 原子遞增
	//   options        // 設定
	// )
	const lastData = await MorderSerialNumberList.findOneAndUpdate(
		{ orderDate: date }, // 下單日期
		{ $inc: { seq: 1 } }, // 原子遞增
		{ new: true, upsert: true } // 沒有就創建
	);

	const dateToNum = date.replace(/\//g, '');
	// console.log('dateToNum', dateToNum);

	// console.log('return', dateToNum + String(lastData.seq).padStart(3, '0'));
	return dateToNum + String(lastData.seq).padStart(3, '0');
};

// ● 計算訂單預約總時數
export const calculateTotalBookingTime = async (data) => {
	// 目前資料格式輸入為 { bookingTime: '10:00～12:00,13:00～15:00', .... }，值的類型是字串
	// 要先轉成陣列後，再拆分成 "時間、分鐘" 的物件
	const time = data.bookingTime;
	// console.log('time', time); // 輸出 '10:00～12:00,13:00～15:00'

	// 小時轉分鐘計算函式
	function hourToMinutes(passInData) {
		const [hour, minu] = passInData.split(':').map(Number); // 輸出 [10, 0]
		return hour * 60 + minu; // 10 小時 * 60分鐘 + 0分鐘 = 600 分鐘
	}

	// 使用累加計算總時數 .reduce()
	const TotalHour = time
		// .split() 拆成「時段陣列」：['10:00～12:00', '13:00～15:00']
		.split(',')
		// 累加計算 .reduce((累積值, 當前元素)=> { return 新的累積值 }, 初始值)
		.reduce((total, el) => {
			// el 是要迴圈的元素，指的就是 '10:00～12:00' 和 '13:00～15:00'
			// .split('～') 注意要依據切開的元素，半形和全形是被視為不同的
			// 使用 "陣列解構（Array Destructuring）"，把「解構」想成「位置對應」
			const [start, end] = el.split('～'); // 輸出 ['10:00', '12:00']
			const hourA = hourToMinutes(start); // 600 分鐘
			const hourB = hourToMinutes(end); // 720 分鐘
			return total + (hourB - hourA) / 60; // 第一個迴圈會回傳 2
		}, 0);

	return TotalHour;
};

// ● 計算訂單總金額
export const calculateTotalBookingPrice = async (data, totalTime) => {
	// 用傳入的資料裡的 dogName，搜尋找出後端資料庫與此相關的狗狗資訊（包含價錢的資訊）
	// 因目前資料庫狗狗價格是 2 小時的價格，故可以先將傳進來的總時數除以 2 再乘以價錢
	const name = data.dogName;
	// console.log('name', name);

	// .find() 尋找多筆與關鍵字相同的資料，回傳 "陣列"，[{A...}, {B...}]，取用指定的值 Array[0].key
	// .findOne() 只會搜尋到一筆資料，回傳 "物件"，{A...}，取用指定的值 Object.key
	const findData = await MdogsData.findOne({ dogName: name });
	if (!findData) {
		throw new Error(`找不到狗狗資料：${name}`);
	}
	// console.log('findData', findData);
	// console.log('fP', findData.price);

	const findPrice = findData.price;
	const hoursFactor = totalTime / 2; // 因上述 findPrice 價格是 2 小時的價格

	return findPrice * hoursFactor;
};
