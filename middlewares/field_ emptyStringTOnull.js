// 此檔案作用，統一將欄位的空字串 ""，轉為 null

export default (req, res, next) => {
	const data = req.body; // 目前資料型態是 object
	// console.log('emptyStringTOnull_data', data);

	// Object.entries() 轉成陣列，拆分成 key、value
	// .map 迴圈修改值（"" 改成 null）
	const dataArray = Object.entries(data).map(([key, value]) => {
		if (typeof value === 'string') {
			value = value.trim();
		}

		return [key, value === '' || value === 'null' || value === undefined ? null : value];
	});

	// 再恢復成物件的資料型態
	const reData = Object.fromEntries(dataArray);

	req.body = reData;

	next();
};
