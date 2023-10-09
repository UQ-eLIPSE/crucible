import type { IResource_FromServer } from "../../src/types/Resource";
import test_question from "../fixtures/quiz_question.json";
import Config from "../../config.json";

/**
 * This test suite tests: 
 *  - creating 
 *  - updating 
 *  - getting 
 *  - deleting
 * questions (resource type 101)
 */
// 
describe("Quiz questions", () =>{
	let question_id = "";

	beforeEach(() => {
		// Log in as admin in order to modify resources
		cy.request({
			method: "POST",
			url: "/api/auth/login/local",
			body: {username: Config.USER.USERNAME, password: Config.USER.PASSWORD}
		});
	});

	// Check you can create a new question resource
	it("can POST question", () => {
		// Create form data to attach to POST request
		const formData = new FormData();
		formData.append("resource", JSON.stringify(test_question));

		cy.request({
			method: "POST",
			url: `/api/resource`,
			body: formData,
		}).as("new-resource")

		cy.get("@new-resource").its("status").should("eq", 200);

		cy.get("@new-resource").then((response) => {
			// Convert Array Buffer to string and parse it as JSON
			let res = Cypress.Blob.arrayBufferToBinaryString(response.body);
			const resource = JSON.parse(res) as IResource_FromServer;

			expect(resource).to.have.property("_id"); 
			question_id = resource._id;
			expect(resource.label).to.eq(test_question.label);
		}) 
	});

	// Check you can get the question just created
	it("can GET question", () => {
		cy.request({
			method: "GET",
			url: `/api/resource/${question_id}`
		}).as("exist-resource");

		cy.get("@exist-resource").its("status").should("eq", 200);

		cy.get("@exist-resource").then((response) => {
			expect(response.body._id).to.eq(question_id);
			expect(response.body.label).to.eq(test_question.label);
		});
	});

	// Check you can update the question label
	it("can PATCH question label", () => {
		// Update the question label
		const updated_data = {...test_question};
		updated_data.label = "Question 2";

		cy.request({
			method: "PATCH",
			url: `/api/resource/${question_id}`,
			body: updated_data,
		}).as("new-resource")

		cy.get("@new-resource").its("status").should("eq", 200);

		cy.get("@new-resource").then((response) => {
			let res = response.body;
			expect(res.label).to.eq(updated_data.label);
		}) 
	})

	// Check you can delete the question
	it("can DELETE question", () => {
		cy.request({
			method: "DELETE",
			url: `/api/resource/${question_id}`
		}).as("delete-resource");

		cy.get("@delete-resource").its("status").should("eq", 200);

		// Try and get resource (should fail and throw 404)
		cy.request({
			method: "GET",
			url: `/api/resource/${question_id}`,
			failOnStatusCode: false
		}).as("exist-resource");

		cy.get("@exist-resource").its("status").should("eq", 404);
	});
});