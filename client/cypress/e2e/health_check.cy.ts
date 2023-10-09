// https://docs.cypress.io/api/introduction/api.html
import Config from "../../config.json";

describe('Health check', () => {
	it('visits the app root url', () => {
		cy.visit('http://localhost:5173/')
		cy.contains('h1', Config.BRANDING.HEADER_TEXT)
	})
})
