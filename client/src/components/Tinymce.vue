<template>
	<div>
		<textarea :id="id"></textarea>
	</div>
</template>

<script lang="ts">
import katex from "katex";
import "katex/dist/contrib/mhchem";
import tinymce, { RawEditorOptions, Editor } from "tinymce";
import { defineComponent, PropType } from "vue";

function openLatexDialog(editor: Editor) {
	return editor.windowManager.open({
		title: "Add latex",
		body: {
			type: "panel",
			items: [
				{
					type: "textarea",
					name: "latexCode",
					label: "latexCode",
				},
			],
		},
		buttons: [
			{
				type: "cancel",
				text: "Close",
			},
			{
				type: "submit",
				text: "Save",
				primary: true,
			},
		],
		onSubmit: function (e: any) {
			var data = e.getData().latexCode;
			// Insert content when the window form is submitted
			const katexString = katex.renderToString(data);
			// Replace only the first occurrence of katex
			// (found in class attribute) and append class mceNonEditable
			editor.insertContent(
				katexString.replace(
					"katex",
					"katex mceNonEditable chemhub-katex-custom-style"
				)
			);
			e.close();
		},
	});
}

/** TinyMCE rich text editor component */

export default defineComponent({
	name: "TinyMCE",
	props: {
		id: {
			type: String,
			required: true,
		},
		options: {
			type: Object as PropType<RawEditorOptions>,
			required: false,
			default: {} as RawEditorOptions,
		},
		modelValue: {
			type: String,
			required: false,
		},
	},
	emits: ["update:modelValue"],
	mounted() {
		//Initial configuration
		let options: RawEditorOptions = {};
		let config = (editor: Editor) => {
			editor.on("NodeChange Change KeyUp", () => {
				this.$emit(
					"update:modelValue",
					tinymce.get(this.id)?.getContent()
				);
			});

			editor.on("init", () => {
				if (this.modelValue != undefined) {
					tinymce.get(this.id)?.setContent(this.modelValue);
				}
			});
			editor.ui.registry.addButton("Tex", {
				text: "LaTex",
				tooltip: "Add LaTex",
				onAction: function () {
					// Open window
					openLatexDialog(editor);
				},
			});
		};

		//Default configuration
		let s1 = (e: Editor) => config(e);
		if (typeof this.options == "object") {
			options = { ...this.options };
			options.skin = "oxide";
			options["valid_elements"] = "*[*]";
			options["content_style"] =
				".chemhub-katex-custom-style:hover,.chemhub-katex-custom-style:active,.chemhub-katex-custom-style:focus {outline: 0.05em solid orange;}";
			// Commented out as causes errors in console with trying to import the styling
			// options["content_css"] =
			// 	"../../node_modules/katex/dist/katex.min.css";
			if (typeof options.setup == "function") {
				s1 = (editor: Editor) => {
					config(editor);
					if (options.setup) options.setup(editor);
				};
			}
		}
		options.selector = "#" + this.id;
		options.setup = (editor: Editor) => s1(editor);
		this.$nextTick(() => {
			tinymce.init(options);
		});
	},
	beforeUnmount() {
		tinymce.execCommand("mceRemoveEditor", false, this.id);
	},
});
</script>
