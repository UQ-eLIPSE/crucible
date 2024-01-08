/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
// declare global {
//   namespace Cypress {
//     interface Chainable {
//       login(email: string, password: string): Chainable<void>
//       drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       dismiss(subject: string, options?: Partial<TypeOptions>): Chainable<Element>
//       visit(originalFn: CommandOriginalFn, url: string, options: Partial<VisitOptions>): Chainable<Element>
//     }
//   }
// }

Cypress.Commands.add("administratorLogin", () => {
	cy.get('[cy-data="admin-button"]').click();
	cy.get('[cy-data="username-field"]').type("admin");
	cy.get('[cy-data="password-field"]').type("test1234");
	cy.get('[cy-data="login-button"]').click();
    cy.intercept("/api/auth/login/local").as("userQuery");
});

Cypress.Commands.add("createResource", () => {
	cy.get('[cy-data="title-field"]').type(`Test Resource`);
	cy.get(
		"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > select"
	).select("IMAGE");
	cy.get(
		"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > div.option > div > div > form > label > input"
	).selectFile("cypress/fixtures/image_test.jpg", { force: true });
	cy.get('[cy-data="save-and-upload-button"]').click();
	cy.intercept("/api/resource/*").as("updateQuery");
	cy.wait("@updateQuery");
});

Cypress.Commands.add("createQuizResource", () => {
	// General details
	cy.get('[cy-data="title-field"]').type(`Test Quiz Resource`);
	cy.get(
		"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > select"
	).select("IMAGE");
	cy.get(
		"#container > div:nth-child(4) > div.resource-list > div > div:nth-child(4) > label > div > div > div > div.option > div > div > form > label > input"
	).selectFile("cypress/fixtures/image_test.jpg", { force: true });

	//Create a quiz
	cy.get(".resource-creator-resource > div:nth-child(7) > div:nth-child(1) > button:nth-child(2)").click();
	cy.get("div.button:nth-child(2)").click();
	cy.get(".controls > button:nth-child(1)").click();
	cy.get(".controls > button:nth-child(1)").click();

	// Make this question correct
	cy.get("div.quiz-dropdown-option:nth-child(3) > select:nth-child(2)").select("Correct");
	cy.get(".controls > button:nth-child(1)").click();

	// Save and upload.
	cy.get('[cy-data="save-and-upload-button"]').click();
	cy.intercept("/api/resource/*").as("updateQuery");
	cy.wait("@updateQuery");
});

Cypress.Commands.add("editResource", () => {
	cy.get('[cy-data="tags-field"]').type("Test");
	cy.get('[cy-data="visibility-checkbox"]').click();
	cy.get(
		"#container > div.content-wrapper > div.content-area > div > button:nth-child(1)"
	).click();
	cy.intercept("/api/resource/*").as("updateQuery");
	cy.wait("@updateQuery");
});

Cypress.Commands.add("editQuizResource", () => {
	// Remove one answer option.
	cy.get("#container > div.content-wrapper > div.content-area > ul > div > div.question > div.quiz-multiple-choice").click();
	cy.get("#container > div.content-wrapper > div.content-area > ul > div > div.question > div.quiz-multiple-choice > div:nth-child(2) > div.dropdown-options > div:nth-child(2) > div.quiz-option-header > div > button").click();
	// Save and upload.
	cy.get('[cy-data="save-button"]').click();
	cy.intercept("/api/resource/*").as("updateQuery");
	cy.wait("@updateQuery");
});


Cypress.Commands.add("createCollection", () => {
	cy.get('[cy-data="create-collection-button"]').click();
	cy.get('[cy-data="collection-title-field"]').type(
		`Test Collection: Test Collection`
	);
	cy.get(
		".resource-creator-collection > div:nth-child(4) > label:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > select:nth-child(2)"
	).select("IMAGE");
	cy.get(
		".resource-creator-collection > div:nth-child(4) > label:nth-child(1) > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div:nth-child(3) > div:nth-child(1) > div:nth-child(1) > form:nth-child(1) > label:nth-child(1) > input:nth-child(1)"
	).selectFile("cypress/fixtures/image_test.jpg", { force: true });
	cy.get('[cy-data="create-button"]').click();
	cy.intercept("POST", "/api/resource/").as("postQuery");
	cy.intercept("GET", "/api/resource/*").as("getQuery");
	cy.intercept("PATCH", "/api/resource/*").as("patchQuery");
	cy.wait("@postQuery");
	cy.wait("@getQuery");
	cy.wait("@patchQuery");
});

Cypress.Commands.add("editCollection", () => {
	cy.get('[cy-data="tags-field"]').type("Test");
	cy.get('[cy-data="visibility-checkbox"]').click();
	cy.get('[cy-data="save-button"]').click();
});
export {};
