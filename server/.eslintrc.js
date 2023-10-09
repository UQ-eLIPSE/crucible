/* eslint-env node */

module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module"
	},
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended"
	],
	plugins: ["@typescript-eslint"],
	rules: {
		"indent": ["error", "tab", { SwitchCase: 1 }],
		"quotes": ["warn", "double"],
		"@typescript-eslint/no-explicit-any": "off",
		"@typescript-eslint/no-non-null-assertion": "off",
		"@typescript-eslint/no-unused-vars": "off"
	}
};
