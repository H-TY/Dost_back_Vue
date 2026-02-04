import { Schema, model } from 'mongoose';

const dogsData = new Schema(
	// =====【正式欄位】=====
	{
		image: {
			type: String,
			required: [true, '狗狗圖片必填']
		},
		dogName: {
			type: String,
			required: [true, '狗狗名字必填']
		},
		age: {
			type: Number,
			required: [true, '狗狗年齡必填']
		},
		price: {
			type: Number,
			required: [true, '預約價格必填'],
			min: [0, '商品價格不能小於 0']
		},
		booking: {
			type: String,
			required: [true, '預約狀態必填']
		},
		bookingTime: {
			type: [String],
			required: [false, '預約已滿時，預約時段可不填']
		},
		feature: {
			type: String,
			required: [true, '狗狗性格、特徵必填']
		},
		sell: {
			type: Boolean,
			required: [true, '上架狀態必填']
		},

		// ===== 2026/2/3 新增正式欄位 =====
		// 狗狗故事
		story: {
			type: String,
			require: [true, '狗狗故事必填'],
			default: ''
		},
		// 疫苗接踵
		vaccine: {
			type: [
				{
					name: {
						type: String,
						require: [true, '疫苗名稱必填寫']
					},
					date: {
						type: String,
						require: [true, '接踵日期必填寫']
					},
					hospital: { type: String }
				}
			],
			require: [true, '疫苗接踵必填'],
			default: []
		}
	},
	// ★=====【試驗區】=====
	// 未來 "新增欄位" 先放這邊測試，若後續確定會使用、不再變動，再升格成 "正式欄位"
	{
		extra: {
			type: Schema.Types.Mixed,
			default: {}
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

export default model('dogs', dogsData);
