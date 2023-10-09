import type { IResource_Document_Internal } from "@/types/Resource";
import { TinyMCE } from "tinymce";

export const tinyMCEPlugins = {
	plugins: [
		"table",
		"advlist",
		"lists",

		// Options could be added later based on requirements
		"code",
		"preview",
		"searchreplace",
		"autolink",
		"directionality",
		"fullscreen",
		"image",
		"link",
		"media",

		"charmap",
		"pagebreak",
		"insertdatetime",
		"advlist",
		"lists",
		"wordcount",
		"help",
		"codesample",

		/** The following plugins have been removed in TinyMCE 6
		 * 	They are kept here for reference so that we can try and
		 * 	find a workaround if they are required in other components
		 */
		// "contextmenu",
		// "colorpicker",
		// "hr",
		// "mediaembed",
		// "noneditable",
		// "print",
		// "paste",
		// "textcolor",
		// "textpattern",
		// "toc",
	],
	toolbar:
		"undo redo | formatselect | fontselect | bold italic underline forecolor backcolor | link image | media | alignleft aligncenter alignright alignjustify  | numlist bullist outdent indent | removeformat fullscreen | Tex | codesample | paste",
};
export const tinyMCEOptions = {
	skin: false,
	image_caption: true,
	media_live_embeds: true,
	plugins: tinyMCEPlugins.plugins,
	codesample_languages: [
		{ text: "Bash", value: "bash" },
		{ text: "Python", value: "python" },
		{ text: "HTML/XML", value: "markup" },
		{ text: "JavaScript", value: "javascript" },
		{ text: "CSS", value: "css" },
		{ text: "PHP", value: "php" },
		{ text: "Ruby", value: "ruby" },
		{ text: "Java", value: "java" },
		{ text: "C", value: "c" },
		{ text: "C#", value: "csharp" },
		{ text: "C++", value: "cpp" },
	],
	codesample_content_css: "src/assets/prism/prism.css",
	toolbar: tinyMCEPlugins.toolbar,
	image_advtab: true,
	//file_picker_callback: callbackfn,
	file_picker_types: "image",
	height: 230,
	font_family_formats:
		"Aileron=aileron, sans-serif;Helvetica=helvetica, arial;Lato=lato, sans-serif;Lobster=lobster, chicago, serif;Noto Serif=noto serif, serif;Permanent Marker=permanent marker, sans-serif;Raleway=raleway, sans-serif;Roboto=roboto, sans-serif;Source Code Pro=source code pro, monospace,Andale Mono=andale mono,times;Arial=arial,helvetica,sans-serif;Arial Black=arial black,avant garde;Book Antiqua=book antiqua,palatino;Comic Sans MS=comic sans ms,sans-serif;Courier New=courier new,courier;Georgia=georgia,palatino;Helvetica=helvetica;Impact=impact,chicago;Symbol=symbol;Tahoma=tahoma,arial,helvetica,sans-serif;Terminal=terminal,monaco;Times New Roman=times new roman,times;Trebuchet MS=trebuchet ms,geneva;Verdana=verdana,geneva;Webdings=webdings;Wingdings=wingdings,zapf dingbats",
	// Only paste plain text
	paste_as_text: true,
	promotion: false,
	branding: false,
};

/**
 * Saves editor content and modify resource
 */
export function saveTinyMceEditorContent(
	tinymce: TinyMCE,
	resource: IResource_Document_Internal
) {
	const rejectPayload = {
		success: false,
		messages: ["Editor contents could not be saved"],
	};

	return new Promise((resolve, reject) => {
		try {
			if (
				!resource ||
				!resource.content ||
				resource.content.html === undefined ||
				resource.content.html === null
			)
				return resolve(rejectPayload);
			// Fetch `editor` associated with this component
			const editor = tinymce.activeEditor;
			// If error does not exist, something is wrong since if this component exists,
			// the corresponding TinyMCE editor should also exist
			if (!editor) return resolve(rejectPayload);

			// Call the `uploadImages` hook and pass a callback function to be executed
			// after `uploadImages` resolves.
			editor
				.uploadImages()
				.then((response: { status: boolean; element: any }[]) => {
					if (!response) return resolve(rejectPayload);

					// Check for unexpected response type
					if (!Array.isArray(response)) return resolve(rejectPayload);

					// Resolve successfully if there are no images
					if (response.length === 0)
						return resolve({ success: true });

					// Resolve if every image was able to be uploaded successfully
					if (
						response.length &&
						response.every((r) => r.status === true)
					) {
						const content = editor.getContent();
						// Set resource html as content
						resource.content.html = content;
						return resolve({ success: true });
					}

					// Reject implicitly
					return resolve(rejectPayload);
				});
		} catch (e) {
			// Reject implicitly if an error is caught
			return reject(rejectPayload);
		}
	});
}
