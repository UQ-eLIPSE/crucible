// TODO: Make enums for errors in the future for better management
import type { FeedbackMessage } from "@/types/SuccessMessage";

/**
 * Class to organize alert messages.
 * Currently used in ResourceCreator
 */
export default class AlertManager {
	private alertMessagesArray: FeedbackMessage[];

	constructor() {
		this.alertMessagesArray = [
			{
				message: "",
				class: "",
			},
		];
	}

	get alertMessages() {
		return this.alertMessagesArray;
	}

	set alertMessages(messageObjectArray: FeedbackMessage[]) {
		this.alertMessagesArray = [...messageObjectArray];
	}

	/** Push new message to message list */
	addMessage(msg: string, className: string) {
		const messageObject: FeedbackMessage = {
			message: msg,
			class: className,
		};
		this.alertMessages.push(messageObject);
	}

	resourceCreationError(resource: string) {
		this.addMessage(
			"Resource " + resource + " could not be created.",
			"error"
		);
	}

	badFileError(e = "") {
		this.clearMessages();
		if (e.length > 0) {
			this.addMessage(e, "error");
		} else {
			this.addMessage("File(s) were not of the correct format.", "error");
		}
	}

	/** Clear all alerts */
	clearMessages() {
		this.alertMessages = [];
	}

	duplicateWarning() {
		this.addMessage(
			"Warning: Some duplicate files were chosen.",
			"warning"
		);
	}

	displayTitleError() {
		this.clearMessages();
		this.addMessage("'Title' field incomplete for resource(s).", "error");
	}

	removeAlertMessage(index: number) {
		this.alertMessages.splice(index, 1);
	}

	postSuccessMessage(resourceLabel: string) {
		this.addMessage(
			"Resource " + resourceLabel + " was added successfully",
			"success"
		);
	}
}
