import { Schema, model } from 'mongoose';

const bookingDateCollectionData = new Schema(
	{
		dogId: {
			type: Schema.Types.ObjectId,
			required: [true, '狗狗 ID 必填']
		},
		dogName: {
			type: String
			// required: [true, '狗狗名稱必填']
		},
		bookingDate: {
			type: String,
			required: [true, '預約日期必填']
		},
		bookingTime: {
			type: String, // 為了避免複雜化以及方便後續查詢，不用 "陣列的資料型態"，將時段都打散成一筆資料
			required: [true, '預約時段必填']
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

/*
MongoDB 的 Unique Index 主要是用來確保資料的唯一性作用；強制資料庫「不允許重複的預約」，資料庫層級的「唯一性保護（constraint）」。

運作原理：
  當載入 Schema 時，Mongoose 會自動在 MongoDB 中建立一個唯一索引（Unique Index），後續執行操作資料庫的動作時，會自動檢查 Unique Index 來判斷索引內是否已建立相同的資料；若沒有相同資料，則允許執行動作，反之則拒絕。

	● 操作資料庫的動作觸發檢查 Unique Index：
	- create()
	- insertMany()
	- save() 新增資料
	- findOneAndUpdate()
	- updateOne()

	▲ 但是以下動作 "不會" 觸發檢查！
	- 查詢 find()
	- 刪除 deleteOne()、deleteMany()

設定要限制的欄位組合，【例如】：選擇 dogId、bookingDate、bookingTime 這三個欄位視為一個組合，同一組組合只能存在一筆資料。
- dogId: 1 其中的數字 1 表示升冪排序，若是 -1 則表示降冪排序，這個數字對於建立索引的唯一性沒有影響。
- unique: true 表示索引的欄位組合不能重複。
*/
bookingDateCollectionData.index({ dogId: 1, bookingDate: 1, bookingTime: 1 }, { unique: true });

export default model('bookingDateCollection', bookingDateCollectionData);
