import { defineConfig } from "cypress";

export default defineConfig({
	e2e: {
		specPattern: "cypress/e2e/**/*.{cy,test}.{js,jsx,tsx}",
		baseUrl: "http://localhost:5173",
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
