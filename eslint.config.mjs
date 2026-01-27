import globals from 'globals';

import path from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import pluginJs from '@eslint/js';

// mimic CommonJS variables -- not needed if using CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname, recommendedConfig: pluginJs.configs.recommended });

export default [
	{ languageOptions: { globals: globals.node } },
	...compat.extends('standard'),
	{
		files: ['**/*.{js,mjs,cjs,vue}'],
		rules: {
			'no-tabs': 'off', // 關閉禁用 tab 的排版規則，不跳出紅字
			indent: 'off', // 不管縮排
			semi: 'off' // 不管分號
			// quotes: 'off' // 不管單雙引號
		}
	}
];
