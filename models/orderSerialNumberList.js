// 訂單流水號管理

import { Schema, model } from 'mongoose';

const orderSerialNumberList = new Schema(
	{
		orderDate: {
			type: String,
			required: true
		},
		seq: {
			type: Number,
			default: 0
		}
	},
	{
		timestamps: true,
		versionKey: false
	}
);

export default model('orderSerialNumberList', orderSerialNumberList);
