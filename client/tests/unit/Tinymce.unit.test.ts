import { saveTinyMceEditorContent } from "../../src/utils/TinyMce";
import { Type as ResourceType } from "../../src/types/Resource";
/**
 * Mocks certain properties of a tinymce editor
 * @param content Content in editor
 * @param cbResult Result returned by TinyMCE's `uploadImages` to callback function
 * @param id
 */
function mockEditor(
	id: number,
	content: any,
	cbResult: { status: boolean; element: any }[]
) {
	return {
		id: id,
		getContent: () => {
			return content;
		},
		uploadImages: (cb: Function) => {
			return cb(cbResult);
		},
	};
}

// Mock the `tinymce` object
const tinymceMock: {
	editors: { [key: number]: any };
} = {
	editors: {},
};

const failResult = {
	success: false,
	messages: ["Editor contents could not be saved"],
};
const passResult = { success: true };

describe("saveTinyMceEditorContent", () => {
	describe("Resource validity test", () => {
		test("Should fail for invalid resource", async () => {
			const resource = undefined;
			const editor = mockEditor(0, "<h1>Title</h1>", [
				{ status: true, element: null },
			]);
			const expectedResult = failResult;

			tinymceMock.editors[editor.id] = editor;
			const data = await saveTinyMceEditorContent(
				tinymceMock,
				editor.id,
				resource as any
			);
			expect(data).toStrictEqual(expectedResult);

			// reset tinymce
			tinymceMock.editors = {};
		});

		test("Should fail for invalid resource.content", async () => {
			const resource = {
				_key: 1,
				type: ResourceType.DOCUMENT_INTERNAL,
				label: "Resource 1",
				tags: [],
				thumbnail: null,
				permissions: {},
				content: undefined,
			};

			const editor = mockEditor(0, "<h1>Title</h1>", [
				{ status: true, element: null },
			]);
			const expectedResult = failResult;

			tinymceMock.editors[editor.id] = editor;
			const data = await saveTinyMceEditorContent(
				tinymceMock,
				editor.id,
				resource as any
			);
			expect(data).toStrictEqual(expectedResult);

			// reset tinymce
			tinymceMock.editors = {};
		});

		test("Should succeed for empty resource.content.html string", async () => {
			const resource = {
				_key: 1,
				type: ResourceType.DOCUMENT_INTERNAL,
				label: "Resource 1",
				tags: [],
				thumbnail: null,
				permissions: {},
				content: {
					html: "",
				},
			};

			const editor = mockEditor(0, "<h1>Title</h1>", [
				{ status: true, element: null },
			]);
			const expectedResult = passResult;

			tinymceMock.editors[editor.id] = editor;
			const data = await saveTinyMceEditorContent(
				tinymceMock,
				editor.id,
				resource
			);
			expect(data).toStrictEqual(expectedResult);

			// reset tinymce
			tinymceMock.editors = {};
		});
	});

	describe("Updation of 'resource.content.html'", () => {
		test("Should update 'resource.content.html'", async () => {
			const resource = {
				_key: 3,
				type: ResourceType.DOCUMENT_INTERNAL,
				label: "Resource 3",
				tags: [],
				thumbnail: null, // TODO: Support for thumbnails not yet present

				permissions: {},
				content: {
					html: "test",
				},
			};
			const editor = mockEditor(0, "<h1>Title</h1>", [
				{ status: true, element: null },
			]);

			tinymceMock.editors[editor.id] = editor;
			await saveTinyMceEditorContent(tinymceMock, editor.id, resource);

			expect(resource.content.html).toBe(
				tinymceMock.editors[editor.id].getContent()
			);

			// reset tinymce
			tinymceMock.editors = {};
		});

		test("Should not update 'resource.content.html'", async () => {
			const starterContent = "test";
			const resource = {
				_key: 3,
				type: ResourceType.DOCUMENT_INTERNAL,
				label: "Resource 3",
				tags: [],
				thumbnail: null, // TODO: Support for thumbnails not yet present

				permissions: {},
				content: {
					html: starterContent,
				},
			};
			const editor = mockEditor(0, "<h1>Title</h1>", [
				{ status: false, element: null },
			]);

			tinymceMock.editors[editor.id] = editor;
			await saveTinyMceEditorContent(tinymceMock, editor.id, resource);

			expect(resource.content.html).toBe(starterContent);

			// reset tinymce
			tinymceMock.editors = {};
		});
	});
});
