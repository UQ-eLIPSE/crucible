describe("Test upload images in TinyMCE", () => {
	beforeEach(() => {
		cy.visit("/");
		cy.administratorLogin();
	});

	it("Should be able to upload an image in a Quiz", () => {
		cy.createResource();
		cy.get(
			'[cy-data="resource-select"]').select("Quiz");
		cy.get(
			'[cy-data="title-field"]').type("Test Quiz");
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > select"
		).select("NO_THUMBNAIL");
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(7) > div > button:nth-child(2)"
		).click();
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(7) > div.question > div.quiz-multiple-choice > div.button.accordion"
		).click();
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(7) > div.question > div.quiz-multiple-choice > div:nth-child(3) > div:nth-child(2) > div > div.tox-editor-container > div.tox-editor-header > div.tox-toolbar-overlord > div > div:nth-child(3) > button:nth-child(2)"
		).click();
		cy.get(
			"body > div:nth-child(5) > div > div.tox-dialog > div.tox-dialog__content-js > div > div.tox-dialog__body-nav > div:nth-child(3)"
		).click();
		cy.get(
			"body > div:nth-child(5) > div > div.tox-dialog > div.tox-dialog__content-js > div > div.tox-dialog__body-content > div > div > div > div > button > input[type=file]"
		).selectFile("cypress/fixtures/image_test.jpg", { force: true });
		cy.get(
			"body > div:nth-child(5) > div > div.tox-dialog > div.tox-dialog__footer > div.tox-dialog__footer-end > button:nth-child(2)"
		).click();
	});
	it("Should be able to upload an image in a Note", () => {
		cy.createResource();
		cy.get(
			'[cy-data="resource-select"]').select("Note (Inline document)");
		cy.get(
			'[cy-data="title-field"]').type("Test Note");
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > select"
		).select("NO_THUMBNAIL");
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div.resource-edit-document-internal.field > div > div > div.tox-editor-container > div.tox-editor-header > div.tox-toolbar-overlord > div > div:nth-child(3) > button:nth-child(2)"
		).click();
		cy.get(
			"body > div:nth-child(5) > div > div.tox-dialog > div.tox-dialog__content-js > div > div.tox-dialog__body-nav > div:nth-child(3)"
		).click();
		cy.get(
			"body > div:nth-child(5) > div > div.tox-dialog > div.tox-dialog__content-js > div > div.tox-dialog__body-content > div > div > div > div > button > input[type=file]"
		).selectFile("cypress/fixtures/image_test.jpg", { force: true });
		cy.get(
			"body > div:nth-child(5) > div > div.tox-dialog > div.tox-dialog__footer > div.tox-dialog__footer-end > button:nth-child(2)"
		).click();
		cy.get(
			"#container > div:nth-child(4) > div.main-controls > div:nth-child(2) > button"
		).click();
	});
});
