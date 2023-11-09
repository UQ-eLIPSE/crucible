import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		specPattern: "cypress/e2e/**/*.{cy,test}.{js,jsx,ts,tsx}",
		baseUrl: "http://localhost:8080",
	},
	component: {
		specPattern: "src/**/__tests__/*.{cy,test}.{js,ts,jsx,tsx}",
		devServer: {
			framework: "vue",
			bundler: "vite",
		},
	},
	video: false,
});
