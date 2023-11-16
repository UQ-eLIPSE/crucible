describe("Test upload images in TinyMCE", () => {
	beforeEach(() => {
		cy.visit("/");
		cy.get("a.nav-item:nth-child(2)").click();
		cy.get(
			".input-fields > label:nth-child(1) > div:nth-child(2) > input:nth-child(1)"
		).type("admin");
		cy.get(
			".input-fields > label:nth-child(2) > div:nth-child(2) > input:nth-child(1)"
		)
			.type("test1234")
			.click();
		cy.get(".button").click();
	});

	it("Should be able to upload an image in a Quiz", () => {
		cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
		cy.get("#container > div.top-bar > div.controls > a").click();
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(1) > label > select"
		).select("Quiz");
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(2) > label > input[type=text]"
		).type("Test Quiz");
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
		cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
		cy.get("#container > div.top-bar > div.controls > a").click();
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(1) > label > select"
		).select("Note (Inline document)");
		cy.get(
			"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(2) > label > input[type=text]"
		).type("Test Note");
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
