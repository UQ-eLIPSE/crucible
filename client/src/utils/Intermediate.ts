import Config from "../../config.json";

export function getIntermediateEnabled(): boolean {
	if (
		Config &&
		Config.QUIZ &&
		Config.QUIZ.ENABLE_INTERMEDIATE_PAGE !== undefined
	) {
		return Config.QUIZ.ENABLE_INTERMEDIATE_PAGE;
	}

	// Disable intermediate state by default. Problem: How to display solution if disabled?
	return false;
}
