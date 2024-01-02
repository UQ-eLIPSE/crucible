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

Cypress.Commands.add('administratorLogin', () => {
    cy.get('[cy-data="admin-button"]').click();
    cy.get('[cy-data="username-field"]').type("admin");
    cy.get('[cy-data="password-field"]').type("test1234")
    cy.get('[cy-data="login-button"]').click();
});

Cypress.Commands.add('createResource', () => {
    cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
    cy.get('[cy-data="create-resource-button"]').click();
})

Cypress.Commands.add('createCollection', () => {
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
    cy.intercept("POST", "/api/resource/").as("createQuery");
    cy.wait("@createQuery");
    cy.visit("/");
    cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
});

// Cypress.Commands.add('deleteCollection', () => {
//     cy.get('[cy-data="delete-collection-button"]').click();
//     cy.get('[cy-data="delete-button"]').click();
//     cy.intercept("DELETE", "/api/resource/").as("deleteQuery");
//     cy.wait("@deleteQuery");
//     cy.visit("/");
//     cy.get(".collection-roots > li:nth-child(1) > a:nth-child(1)").click();
// });

export {}
