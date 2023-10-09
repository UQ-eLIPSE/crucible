export interface SuccessMessage {
	success: boolean;
	messages?: string[];
}

export interface StatusMessage {
	message: string;
	type: string;
}

// Interface to store operation (create and copy resource) feedback in
export interface FeedbackMessage {
	message: string;
	class: string;
}
