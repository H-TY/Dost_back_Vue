// 定義我的最愛 / 追蹤商品

import { Schema, model } from 'mongoose';

const userFavoriteSchema = new Schema(
	{
		userId: {
			type: Schema.Types.ObjectId,
			required: [true, '使用者 ID 必填'],
			unique: true, // 避免同一使用者出現多份我的最愛資料。
			ref: 'users' // ref 用來告訴 Mongoose，userId 這個 ObjectId 是關聯到哪個 model（model 的名稱則是看要關聯的檔案 export 時的命名，例如：export default model('users', userData);）
		},
		dogLike: {
			type: [Schema.Types.ObjectId],
			default: []
		},
		productLike: {
			type: [Schema.Types.ObjectId],
			default: []
		}
	},
	{
		// timestamps 紀錄帳號創建時間和帳號最後更新時間
		timestamps: true,
		// versionKey 紀錄資料修改幾次
		versionKey: false
	}
);

export default model('userFavorite', userFavoriteSchema);
