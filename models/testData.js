import { Schema, model } from 'mongoose';

const testsData = new Schema(
	{
		userID: {
			type: String,
			required: [true, '使用者 ID 必填']
		},
		userName: {
			type: String,
			required: [true, '使用者名字必填']
		},
		testStatus: {
			type: Boolean,
			required: [true, '測試狀態必填']
		},
		// 👉 上一次測試結果
		previousResult: {
			date: {
				type: Date,
				default: null
			},
			result: {
				type: String,
				default: null
			}
		},
		// 👉 這次測試結果
		currentResult: {
			date: {
				type: Date,
				default: null
			},
			result: {
				type: String,
				default: null
			}
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

export default model('tests', testsData);
