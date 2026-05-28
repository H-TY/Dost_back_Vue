import { Schema, model } from 'mongoose';

const bookingDateCollectionData = new Schema(
	{
		dogId: {
			type: Schema.Types.ObjectId
			// required: [true, '狗狗 ID 必填']
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

// 作用：強制資料庫「不允許重複的預約」，資料庫層級的「唯一性保護（constraint）」
bookingDateCollectionData.index({ dogId: 1, dogName: 1, bookingDate: 1, bookingTime: 1 }, { unique: true });

export default model('bookingDateCollection', bookingDateCollectionData);
