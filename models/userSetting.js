// 定義 "偏好設定" 的 model

import { Schema, model } from 'mongoose';

const userSettingData = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: [true, '使用者 ID 必填'],
			unique: true, // 避免同一使用者出現多份設定。
			ref: 'users' // ref 用來告訴 Mongoose，userId 這個 ObjectId 是關聯到哪個 model（model 的名稱則是看要關聯的檔案 export 時的命名，例如：export default model('users', userData);）
		},
		settings: {
			themeColor: {
				type: String,
				// enum = enumeration（列舉）把允許的值「列舉」出來，限制欄位只能填入指定值
				enum: {
					values: ['default', 'green-theme'],
					message: 'themeColor 無效，輸入非指定值'
				},
				default: 'default'
			},
			fontSize: {
				type: Number,
				min: [12, '文字 size 最小值 12'],
				max: [28, '文字 size 最大值 28'],
				default: 16,
				validate: {
					validator: Number.isInteger,
					message: '文字 size 必須為整數'
				}
			}
		}
	},
	{
		// timestamps 紀錄帳號創建時間和帳號最後更新時間
		timestamps: true,
		// versionKey 紀錄資料修改幾次
		versionKey: false
	}
);

export default model('userSetting', userSettingData);
