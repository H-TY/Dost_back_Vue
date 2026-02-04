// migrations\DBupdate.js
// ★ 這個檔案是要統一更新 DB 資料庫欄位用的腳本，包含 "搜尋 / 新增 / 移除" 欄位
// ★ 建議手動更新：在 "終端機" 操作，輸入指令（指令可在 package.json 裡的 scripts 欄位修改自訂慣用的英文字）
// 原始輸入指令：node migrations/DBupdate.js add 或 remove 或 find
// - 在 package.json 裡的 scripts 欄位可以設定成：
// "scripts": {
//   "db:add": "node migrations/DBupdate.js add"
// },
// - 終端機輸入的指令則為：npm run db:add

import mongoose from 'mongoose';
import 'dotenv/config';
import MdogsData from '../models/dogsData.js';

async function connectDB() {
	await mongoose.connect(process.env.DB_URL, {
		// 以下兩行，主要是解決舊版 MongoDB driver 的一些警告和兼容性問題。
		useNewUrlParser: true, // 使用新版的 URL 解析器來解析 MongoDB 連線字串，避免警告 & 支援新格式 URI
		useUnifiedTopology: true // 啟用新版拓撲引擎（Unified Topology）管理連線，避免警告 & 改善連線穩定性
	});
	console.log(`目前已連線至 DB 資料庫，稍後執行 ${action} 指令`);
}

// ● 搜尋、查詢要 更新/移除 的欄位
export async function findField() {
	await connectDB();
	try {
		const missingStoryField = await MdogsData.countDocuments({ story: { $exists: false } });
		const missingVaccineField = await MdogsData.countDocuments({ vaccine: { $exists: false } });
		const existingField = await MdogsData.countDocuments({ counter: { $exists: true } });

		console.log(`將新增 "狗狗故事" 欄位數量: ${missingStoryField}`);
		console.log(`將新增 "疫苗接踵" 欄位數量: ${missingVaccineField}`);
		console.log(`將移除 "點單數量" 欄位數量: ${existingField}`);

		// process.exit(code) 是 Node.js 的 結束程式指令，它會立即終止程式執行，並可帶一個 "退出碼（exit code）" 表示程式的狀態，用來告訴作業系統或其他程式「程式怎麼結束」。
		// 慣例：
		// 0 → 正常結束 ✅
		// 非 0 → 發生錯誤 ❌（通常用 1）
		process.exit(0); // Node.js 的結束程式指令
	} catch (error) {
		console.log('❌ DB 資料庫 "搜尋欄位" 發生錯誤:', error);
		process.exit(1);
	}
}

// ● 新增欄位
export async function addField() {
	await connectDB();
	try {
		// ● $set: {} 新增欄位
		// 先搜尋是否有指定的欄位存在（目前是指定 story 和 vaccine 的欄位），不存在就新增欄位（新增的欄位可以設定預設值）
		// 建議要新增 key 欄位寫成一個程式碼，避免覆蓋掉已經有相對應的 key 的值
		const addOneField = await MdogsData.updateMany(
			{ story: { $exists: false } },
			{
				$set: {
					story: ''
				}
			}
		);
		console.log(`📌 已新增 "XX" 欄位數量: ${addOneField.modifiedCount}`);

		process.exit(0);
	} catch (error) {
		console.log('❌ DB 資料庫 "新增欄位" 發生錯誤:', error);
		process.exit(1);
	}
}

// ● 移除欄位
export async function removeField() {
	await connectDB();
	try {
		// ● $unset: {} 移除多個欄位
		// 用 $or:[{條件1},{條件2}] 搜尋，只要符合其中一個條件即可
		// 刪除了欄位值的資料型態是什麼，不影響刪除動作，所以寫成 '' 即可
		const remove = await MdogsData.updateMany(
			{
				$or: [{ counter: { $exists: true } }]
			},
			{
				$unset: {
					counter: ''
				}
			}
		);
		console.log(`📌 已移除欄位數量: ${remove.modifiedCount}`);

		process.exit(0);
	} catch (error) {
		console.log('❌ DB 資料庫 "移除欄位" 發生錯誤:', error);
		process.exit(1);
	}
}

// ----------------------------
// ● 在終端機，透過命令列參數決定要執行哪個函式
// ----------------------------
// * process.argv[2] 陣列的組成：
// [
//   '/usr/local/bin/node',                  // index 0 → Node.js 執行檔路徑
//   '/你的專案路徑/migrations/DBupdate.js', // index 1 → 被執行的 JS 檔案
//   'add'                                   // index 2 → 你自己傳入的參數
// ]
// * 原始指令例如： node migrations/DBupdate.js add 或 remove 或 find
const action = process.argv[2];

if (action === 'find') {
	findField();
} else if (action === 'add') {
	addField();
} else if (action === 'remove') {
	removeField();
} else {
	console.log('請在 npm run 尾部輸入指令：查詢 db:find、新增欄位 db:add、移除欄位 db:remove');
	process.exit(1);
}
