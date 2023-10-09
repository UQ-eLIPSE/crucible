/* eslint-env node */
require("@rushstack/eslint-patch/modern-module-resolution");

module.exports = {
	root: true,
	extends: [
		"plugin:vue/vue3-essential",
		"eslint:recommended",
		"@vue/eslint-config-typescript",
		"@vue/eslint-config-prettier",
	],
	overrides: [
		{
			files: [
				"**/__tests__/*.{cy,test}.{js,ts,jsx,tsx}",
				"cypress/e2e/**/*.{cy,test}.{js,ts,jsx,tsx}",
			],
			extends: ["plugin:cypress/recommended"],
		},
	],
	rules: {
		indent: ["error", "tab", { SwitchCase: 1 }],
		quotes: ["warn", "double"],
	},
	parserOptions: {
		ecmaVersion: "latest",
	},
	ignorePatterns: ["cypress/*", "/src/assets/prism/*"], // Ignore default cypress folder
};
