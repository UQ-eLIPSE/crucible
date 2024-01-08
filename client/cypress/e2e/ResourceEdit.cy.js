describe("Test ResourceEditor Component", () => {
    beforeEach(() => {
		cy.visit("/");
		cy.administratorLogin();
        cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
        cy.get('[cy-data="create-resource-button"]').click();
        cy.get('[cy-data="create-collection-button"]').click();
		cy.createCollection();
		cy.visit("/");
        cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
        cy.get('span').contains('Test Collection: Test Collection').click();
        cy.get('[cy-data="create-resource-button"]').click();
	});

    afterEach(() => {
        cy.get("#container > div.top-bar > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2)").click();
        cy.get("#container > div.top-bar > div.resource-path-breadcrumbs.breadcrumbs > ul > li.edit-link > a").click();
        cy.get("#container > div > div.content-area > div.save-bar > button.button.delete-button").click();
    })
    
    it.only("Should be able to create/edit a resource in a collection (Link)", () => {
        //Create a resource
        cy.get('[cy-data="resource-select"]').select("Link");
        cy.createResource();

        //Edit the Resource
        cy.get("#container > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get('[cy-data="edit-resource-button"]').click();
        cy.editResource();

        // Check if the resource exists
        cy.get("#container > div.content-wrapper > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li:nth-child(1) > a > div.hidden-label").should("exist");
    });

    it("Should be able to create/edit a resource in a collection (Document)", () => {
        //Create a resource
        cy.get('[cy-data="resource-select"]').select("Quiz");
        cy.createQuizResource();
        cy.get(".resource-path-breadcrumbs > ul:nth-child(1) > li:nth-child(2)").click();
        cy.get("li.list-item:nth-child(1) > a:nth-child(1) > div:nth-child(2)").click();
        cy.get("#container > div.content-area > div > div > div > div.mutiple-choice-question > ul ")
        .find('li')
        .should('have.length', 3);


        //Edit the Resource to have 2 options.
        cy.get("#container > div.top-bar > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get(".edit-controls > li:nth-child(3)").click();
        cy.editQuizResource();
        cy.get("#container > div.content-wrapper > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li > a > div.overlay").click();
        cy.get("#container > div.content-area > div > div > div > div.mutiple-choice-question > ul ")
        .find('li')
        .should('have.length', 2);
    });

    it("Should be able to create/edit a collection within a collection", () => {
        // Create a collection
        cy.createCollection();
        cy.get("#container > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li:nth-child(1) > a > div.overlay").click();
       
        // Create a resource within the collection
        cy.get('[cy-data="create-resource-button"]').click();
        cy.get('[cy-data="resource-select"]').select("Link");
        cy.createResource();
        cy.get("#container > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(3) > a").click();
        cy.get("#container > div.content-area > div > ul > li").should("exist");

        // Edit collection to be hidden and check if the resource still exists.
        cy.get('[cy-data="edit-collection-button"]').click();
        cy.editCollection();
        cy.get("#container > div > div.resource-path-breadcrumbs.breadcrumbs > ul > li:nth-child(2) > a").click();
        cy.get("#container > div.content-area > div > ul > li > a > div.hidden-label").click();
        cy.get("#container > div.content-area > div > ul > li").should("exist");

    });
});
