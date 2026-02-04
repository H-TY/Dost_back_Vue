// 此檔案作為 "資料邏輯計算"，提供給 controllers 引用

import MbookingOrderData from '../models/bookingOrder.js';
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
	//   update,        // 要怎麼改，$inc 原子遞增（$inc (increment) 操作符，是 MongoDB 的寫法）
	//   options        // 設定
	// )
	const lastData = await MorderSerialNumberList.findOneAndUpdate(
		{ orderDate: date }, // 尋找關鍵字 "訂單日期"
		{ $inc: { seq: 1 } }, // 原子遞增，根據關鍵字找到的資料中，seq 值依序遞增 +1
		{ new: true, upsert: true } // 沒有就創建；有就更新上述 seq 的值
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
export const calculateTotalBookingPrice = async (data, dogId, totalTime) => {
	// 用傳入的資料裡的 dogName，搜尋找出後端資料庫與此相關的狗狗資訊（包含價錢的資訊）
	// 因目前資料庫狗狗價格是 2 小時的價格，故可以先將傳進來的總時數除以 2 再乘以價錢
	const name = data.dogName;
	// console.log('name', name);
	// console.log('OS_dogId:', dogId);

	// .find() 尋找多筆與關鍵字相同的資料，回傳 "陣列"，[{A...}, {B...}]，取用指定的值 Array[0].key
	// .findOne() 只會搜尋到一筆資料，回傳 "物件"，{A...}，取用指定的值 Object.key
	const findData = await MdogsData.findOne({ _id: dogId });
	if (!findData) {
		throw new Error(`找不到狗狗資料：${name}`);
	}
	// console.log('findData', findData);
	// console.log('fP', findData.price);

	const findPrice = findData.price;
	const hoursFactor = totalTime / 2; // 因上述 findPrice 價格是 2 小時的價格

	return findPrice * hoursFactor;
};

// ● 計算前三名訂單，並回傳相對應的狗狗資訊
export const calculateTopThreeOrder = async (date) => {
	// console.log('OS_date', date);
	// 前端傳入的 date，傳至後端時，資料類型會被改為 "字串"，後續要將數值用作計算，故使用 Number() 將資料類型改為數字
	const year = Number(date.year);
	const month = Number(date.month);
	// console.log('OS_year', typeof year, year);
	// console.log('OS_month', typeof month, month);

	// 預設要抓取的幾個月份的資料
	// 從當下月份往回推要抓取的總月份，並把它放置 monthList 的空陣列，用作關鍵字搜尋
	const getTotal = 4; // 總計要抓取 4 個月份的資料
	const monthList = [];

	// ★全部轉成總月份來計算，將年也轉成月份；與時間的計算方式相同，較不會越算越亂
	// 公式核心：year * 12 + (month - 1) → 將年月轉成「可線性加減的整數月份」
	for (let i = 0; i < getTotal; i++) {
		const totalMonth = year * 12 + (month - 1);

		// Math.floor() 無條件捨去；對比另一個 Math.ceil() 無條件進位
		// .toString() 轉為文字，方便後續作關鍵字搜尋用
		// .padStart(2, '0') 資料類型須為文字/字符/字符串，用零補足至 2 位數
		const toYear = Math.floor((totalMonth - i) / 12).toString();
		const toMonth = (((totalMonth - i) % 12) + 1).toString().padStart(2, '0');

		monthList.push(toYear + toMonth);
	}
	// console.log('monthList', monthList);

	// 若要用正則表達式的搜尋多個關鍵字，關鍵字間需用 | 作分隔
	// 正則表達式的 | 表示"或"，用來匹配多個關鍵字
	const remonthList = monthList.join('|');
	// console.log('remonthList', remonthList)

	// 用 remonthList 作為關鍵字
	// i 代表 ignore case（忽略大小寫）
	const regex = new RegExp(remonthList, 'i');

	// .find 指定搜尋訂單狀態有效，且訂單編號用 regex 做關鍵字搜尋
	let data = await MbookingOrderData.find({
		orderStatus: true,
		bookingOrderNumber: regex
	});
	// console.log('COdata', data)

	// 計算狗狗名字在 data 個別出現的次數
	// 用 reduce 做迴圈累加
	// acc 累加的值
	// 輸出的資料是物件
	let countDogName = data.reduce((acc, el) => {
		acc[el.dogName] = (acc[el.dogName] || 0) + 1;
		return acc;
	}, {});
	// console.log('countDogName', countDogName);

	// 但在抓取總月份的區間沒有資料、資料過少或是計算排名不足 3 名，則改為搜尋全部訂單
	if (data.length === 0 || Object.keys(countDogName).length < 3) {
		data = await MbookingOrderData.find({
			orderStatus: true
		});
		// console.log('ALLCOdata', data)

		countDogName = data.reduce((acc, el) => {
			acc[el.dogName] = (acc[el.dogName] || 0) + 1;
			return acc;
		}, {});
	}

	// 排序並取前 3 位的資料，並轉成正則表達式做為搜尋的關鍵字
	// b-a 做降冪排序（由多到少）
	const TopThree = Object.entries(countDogName)
		.sort((a, b) => {
			// console.log('a', a)
			// console.log('a[1]', a[1])
			return b[1] - a[1];
		})
		// 取前 3 位元素
		.splice(0, 3)
		// 將資料轉成自己想要的資料樣式
		.map(([dogName, counter]) => {
			return { dogName, counter };
		});
	// console.log('TopThree', TopThree);
	// 輸出 TopThree [
	//   { dogName: '二哈', counter: 6 },
	//   { dogName: '柯基', counter: 5 },
	//   { dogName: 'RRR', counter: 4 }
	// ]

	// 有多個關鍵字要搜尋用 | 隔開
	// 參數不加上 'i'（忽略英文大小寫），因為目前狗狗名稱有 RRR、rrr
	// 狗狗名稱有 RRR、RRRTTT，是會被視為條件匹配，故為防止這種情形發生，可以使用 "字串邊界 ^ 和 $"，讓名稱完全一致才算。
	const regexTopThree = new RegExp('^(' + TopThree.map((el) => el.dogName).join('|') + ')$');
	// console.log('regexTopThree', regexTopThree);

	// 利用 regexTopThree 抓到的狗狗名稱從後端 "狗狗資料庫" 抓取訂單前三名的狗狗資料
	// 查詢 Mongoose 資料時就加上 .lean()，就會直接回傳 "普通 JS 物件"，而不是 Mongoose Document（Document 可以使用 .save(), .populate(), .get(), .set() 等方法）
	const TopThreeDogs = await MdogsData.find({
		dogName: regexTopThree
	}).lean();
	// console.log('TopThreeDogs', TopThreeDogs);

	// ★ 因找出的 TopThreeDogs 資料並不是排序過的，再用 .map() 塞進上面計算出的總訂單數量 counter，並生成依據 TopThree 順序的新陣列
	const reTopThreeDogs = TopThree.map(({ dogName, counter }) => {
		const data = TopThreeDogs.find((el) => el.dogName === dogName);
		return { ...data, counter };
	});
	// console.log('reTopThreeDogs', reTopThreeDogs);

	return reTopThreeDogs;
};
