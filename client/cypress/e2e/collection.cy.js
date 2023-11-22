describe("Test thumbnail upload in a collection", () => {
	beforeEach(() => {
		cy.visit("/");
		cy.administratorLogin();
	});

	it("Should be able to upload an thumbnail when creating a collection", () => {
		cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
		cy.get('[cy-data="create-resource-button"]').click();
		cy.get('[cy-data="create-collection-button"]').click();
		cy.get('[cy-data="collection-title-field"]').type(
			`Test Collection: ${Math.floor(Math.random() * 100) + 1}`
		);
		cy.get(
			".resource-creator-collection > div:nth-child(4) > label:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > select:nth-child(2)"
		).select("IMAGE");
		cy.get(
			".resource-creator-collection > div:nth-child(4) > label:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > form:nth-child(1) > label:nth-child(1) > input:nth-child(1)"
		).selectFile("cypress/fixtures/image_test.jpg", { force: true });
		cy.get('[cy-data="create-button"]').click();
		cy.intercept("POST", "/api/resource/").as("createQuery");
		cy.wait("@createQuery");
		cy.visit("/");
		cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
		cy.get(".list-item:last-child > a > .background").should(
			"have.css",
			"background-image"
		);
	});
});
