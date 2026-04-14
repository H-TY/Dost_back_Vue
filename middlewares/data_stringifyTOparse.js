// 這邊集中處理 "資料格式的轉換"：
// 將前端原陣列資料因需用 JSON.stringify() 轉為字串才能傳進後端，到這一步再轉回原本的陣列格式，並賦值給原值（這邊要轉換的欄位資料：bookingTime, vaccine）
// 判斷是否為 JSON 資料格式，用 try...catch 和 JSON.parse()，確認是否可以成功轉換成物件或陣列，若成功則將轉換後的資料賦值回原值；若失敗則保持原值不變

export default (req, res, next) => {
	const data = req.body;
	// console.log('STPdata', data);

	// Object.entries(data) 將把物件轉成「key + value」的二維陣列
	// 範例格式如下：
	//   const data = {
	//      name: '小白',
	//      age: 3
	//   };
	//  Object.entries(data) 會轉換成：
	//   [
	//     ['name', '小白'],
	//     ['age', 3]
	//   ]
	// 接著使用 forEach() 迭代這個二維陣列，對每一個 key 和 value 進行處理
	Object.entries(data).forEach(([key, value]) => {
		// 若值不是字串，則不處理
		if (typeof value !== 'string') return;

		// 只能用 try...catch 來判斷是否為 JSON 格式
		try {
			const parseValue = JSON.parse(value);

			if (typeof parseValue === 'object' && parseValue !== null) {
				data[key] = parseValue;
			}
		} catch (error) {
			// 如果 JSON.parse() 失敗，會丟出錯誤，這裡捕捉錯誤並保持原值不變
			// console.log(`欄位 ${key} 的值不是有效的 JSON 格式，保持原值不變`);
		}
	});

	next();
};
