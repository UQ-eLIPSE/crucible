describe("Test thumbnail upload in the ResourceEditor Component", () => {
    beforeEach(() => {
		cy.visit("/");
		cy.administratorLogin();
		cy.createResource();
		cy.createCollection();
		
	});
    
    it("Should be able to upload a thumbnail when editing a resource", () => {
        cy.get(".list-item:first-child > a > .background").click();
        cy.get('[cy-data="edit-resource-button"]').click();
        cy.get('[cy-data="resource-thumbnail-field"]').selectFile("cypress/fixtures/image_test.jpg", { force: true });
        cy.get('[cy-data="save-button"]').click();
        cy.intercept("PUT", "/api/resource/").as("updateQuery");
        cy.wait("@updateQuery");
        cy.visit("/");
        cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
        cy.get(".list-item:first-child > a > .background").should(
            "have.css",
            "background-image"
        );
    });
});
