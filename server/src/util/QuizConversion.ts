import { convertQuiz } from "../util/ConvertQuizzes";
import { addChildrenTags } from "../util/AddTags";
import { Database } from "../database";
import { getConfig } from "./Config";

const runConvertQuiz = async () => {
	const config = getConfig();
	await Database.init(config.DATABASE.URI);
	// Convert any quizzes to new format
	await convertQuiz();
	// Apply test tags to resources
	await addChildrenTags("Test");

	process.exit(0);
};

runConvertQuiz();
