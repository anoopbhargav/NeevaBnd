module.exports = {
	root: true,
	env: {
		node: true,
		commonjs: true,
		es2021: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'prettier',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		indent: ['error', 'tab'],
		'linebreak-style': ['error', 'unix'],
		quotes: ['error', 'single'],
		semi: ['error', 'always'],
		'@typescript-eslint/no-var-requires': 0,
		'@typescript-eslint/ban-types': [
			'error',
			{
				types: {
					Function: false,
					String: false,
				},
				extendDefaults: true,
			},
		],
	},
};
