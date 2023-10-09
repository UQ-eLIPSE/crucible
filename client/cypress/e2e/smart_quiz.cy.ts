import type { IResource_FromServer } from "../../src/types/Resource";
import test_question from "../fixtures/quiz_question.json";
import smart_quiz from "../fixtures/smart_quiz.json";
import Config from "../../config.json";

/**
 * This test suite tests: 
 *  - creating 
 *  - updating 
 *  - getting 
 *  - deleting
 * Smart quizzes (resource type 4)
 */
// 
describe("Smart Quiz", () =>{
	let question_id = "";
	let quiz_id = "";

	beforeEach(() => {
		// Log in as admin in order to modify resources
		cy.request({
			method: "POST",
			url: "/api/auth/login/local",
			body: {username: Config.USER.USERNAME, password: Config.USER.PASSWORD}
		});

		// Create new question to attach to smart quiz
		// Create form data to attach to POST request
		const formData = new FormData();
		formData.append("resource", JSON.stringify(test_question));

		cy.request({
			method: "POST",
			url: `/api/resource`,
			body: formData,
		}).as("new-resource")

		cy.get("@new-resource").then((response) => {
			// Convert Array Buffer to string and parse it as JSON
			let res = Cypress.Blob.arrayBufferToBinaryString(response.body);
			const resource = JSON.parse(res) as IResource_FromServer;

			question_id = resource._id;
		}) 
	});

	// Check you can create a new quiz resource
	it("can POST quiz", () => {
		smart_quiz
		// Create form data to attach to POST request
		const formData = new FormData();
		formData.append("resource", JSON.stringify(smart_quiz));

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
			quiz_id = resource._id;
			expect(resource.label).to.eq(smart_quiz.label);
			expect(resource.content.children).to.contain(question_id);
		}) 
	});

	// Check you can get the quiz just created
	it("can GET quiz", () => {
		cy.request({
			method: "GET",
			url: `/api/resource/${quiz_id}`
		}).as("exist-resource");

		cy.get("@exist-resource").its("status").should("eq", 200);

		let test_question = "";
		
		cy.get("@exist-resource").then((response) => {
			expect(response.body._id).to.eq(quiz_id);
			expect(response.body.label).to.eq(smart_quiz.label);
			expect(response.body.content.children).length.greaterThan(0);
			test_question = (response.body.content.children[0]);
		});

		// Test that first question of Smart Quiz is a valid question
		cy.request({
			method: "GET",
			url: `/api/resource/${test_question}`
		}).as("exist-question");
		cy.get("@exist-question").its("status").should("eq", 200);
	});

	// Check you can update quiz title
	it("can PATCH quiz label", () => {
		// Add question to quiz
		const updated_data = {
			label: "Updated smart quiz"
		};

		cy.request({
			method: "PATCH",
			url: `/api/resource/${quiz_id}`,
			body: updated_data,
		}).as("new-resource")

		cy.get("@new-resource").its("status").should("eq", 200);

		cy.get("@new-resource").then((response) => {
			let res = response.body;
			expect(res.label).to.eq(updated_data.label);
			expect(res.content.children).length.greaterThan(0);
		}) 
	})

	// Check you can update quiz thumbnail
	it("can PATCH quiz thumbnail", () => {
		// Add question to quiz
		const updated_data = {
			thumbnail:{
				url: "https://cdn.pixabay.com/photo/2023/01/10/22/48/ai-generated-7710624_960_720.jpg",
				size: "cover"
			}
		};

		cy.request({
			method: "PATCH",
			url: `/api/resource/${quiz_id}`,
			body: updated_data,
		}).as("new-resource")

		cy.get("@new-resource").its("status").should("eq", 200);

		cy.get("@new-resource").then((response) => {
			let res = response.body;
			expect(res.thumbnail.url).to.eq(updated_data.thumbnail.url);
		}) 
	})

	// Check you can delete the quiz
	it("can DELETE question", () => {
		cy.request({
			method: "DELETE",
			url: `/api/resource/${quiz_id}`
		}).as("delete-resource");

		cy.get("@delete-resource").its("status").should("eq", 200);

		// Try and get resource (should fail and throw 404)
		cy.request({
			method: "GET",
			url: `/api/resource/${quiz_id}`,
			failOnStatusCode: false
		}).as("exist-resource");

		cy.get("@exist-resource").its("status").should("eq", 404);
	});

	afterEach(() => {
		// Remove question used for testing smart quizzes
		cy.request({
			method: "DELETE",
			url: `/api/resource/${question_id}`
		}).as("delete-question");
		cy.get("@delete-question").its("status").should("eq", 200);
	})
});