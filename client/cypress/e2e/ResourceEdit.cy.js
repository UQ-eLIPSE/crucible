describe("Test thumbnail upload in the ResourceEditor Component", () => {
    beforeEach(() => {
		cy.visit("/");
		cy.administratorLogin();
		cy.createResource();
		cy.createCollection();
		
	});

    afterEach(() => {
        cy.get("#container > div.top-bar > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.top-bar > div.resource-path-breadcrumbs.breadcrumbs > ul > li.edit-link > a").click();
        cy.get("#container > div > div.content-area > div.save-bar > button.button.delete-button").click();
    })
    
    it("Should be able to create and edit a resource", () => {
        cy.visit("/");
        cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
        cy.get('span').contains('Test Collection: Test Collection').click();
        cy.get('[cy-data="create-resource-button"]').click();
        cy.get('#container > div:nth-child(4) > div.resource-list > div > div:nth-child(1) > label > select').select("Link");
        cy.get('[cy-data="title-field"]').type(`Test Resource`);
        cy.get("#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > select").select("IMAGE");
        cy.get("#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > div.option > div > div > form > label > input").selectFile("cypress/fixtures/image_test.jpg", { force: true });
        cy.get('#container > div:nth-child(4) > div.main-controls > div:nth-child(2) > button').click();
        cy.intercept("/api/resource/*").as("updateQuery");
        cy.wait("@updateQuery");
        cy.get("#container > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li:nth-child(1) > a > ul > li:nth-child(3) > a").click()
        cy.get("#container > div.content-wrapper > div.content-area > ul > li:nth-child(2) > label > input[type=text]").type("Test");
        cy.get("#container > div.content-wrapper > div.content-area > ul > li:nth-child(4) > label > input").click();
        cy.get("#container > div.content-wrapper > div.content-area > div > button:nth-child(1)").click();
        cy.intercept("/api/resource/*").as("updateQuery");
        cy.wait("@updateQuery");
        cy.get("#container > div.content-wrapper > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li:nth-child(1) > a > div.hidden-label").should("exist");
    });

    it("Should be able to create and edit a collection within a collection", () => {
        cy.visit("/");
        cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
        cy.get('span').contains('Test Collection: Test Collection').click();
        cy.get('[cy-data="create-resource-button"]').click();
        cy.createCollection();
        cy.get("#container > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li:nth-child(1) > a > div.overlay").click();
       

        //Create A resource
        cy.get('[cy-data="create-resource-button"]').click();
        cy.get('#container > div:nth-child(4) > div.resource-list > div > div:nth-child(1) > label > select').select("Link");
        cy.get('[cy-data="title-field"]').type(`Test Resource`);
        cy.get("#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > select").select("IMAGE");
        cy.get("#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > div.option > div > div > form > label > input").selectFile("cypress/fixtures/image_test.jpg", { force: true });
        cy.get('#container > div:nth-child(4) > div.main-controls > div:nth-child(2) > button').click();
        cy.intercept("/api/resource/*").as("updateQuery");
        cy.wait("@updateQuery");
        cy.get("#container > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(3) > a").click();
        cy.get("#container > div.content-area > div > ul > li").should("exist");

        // // Edit collection to be hidden and check if the resource still exists.
        cy.get("#container > div.top-bar > div.resource-path-breadcrumbs.breadcrumbs > ul > li.edit-link > a").click();
        cy.get("#container > div > div.content-area > ul > li:nth-child(2) > label > input[type=text]").type("Test");
        cy.get("#container > div > div.content-area > ul > li:nth-child(4) > label > input").click();
        cy.get("#container > div > div.content-area > div > button:nth-child(1)").click();
        cy.get("#container > div > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li > a > div.hidden-label").click();
        cy.get("#container > div.content-area > div > ul > li").should("exist");

    });
});
