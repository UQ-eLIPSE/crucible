import * as mongodb from "mongodb";
import { getAllResources } from "./GetAllResource";

interface GraphResource {
	_id: mongodb.ObjectId;
	label: string;
	type: string;
	children?: GraphResource[];
	questionContent?: string;
	numChoices?: number;
	hasHint?: boolean;
	hasAdditionalHint?: boolean;
	hasAdditionalInfo?: boolean;
	content?: {
		questionList?: GraphResource[];
	};
}
type DepthInfoType = {
	maxDepth: number;
};

/**
 * This function transforms a hierarchical tree structure into a CSV formatted string. The tree structure
 * should represent data in a nested manner, where each node contains information that can be translated
 * into a row in the CSV output.
 *
 * @param tree - A nested tree structure that needs to be converted.
 *
 * @returns csv - A string representing the tree structure in CSV format.
 */
export async function convertTree() {
	try {
		const outputData = await getAllResources();
		const treeData: GraphResource = JSON.parse(
			JSON.stringify(outputData, null, 4)
		);
		const { results, depthInfo } = treeToCsv(treeData);
		const headers = Array.from(
			{ length: depthInfo.maxDepth },
			(_, index) => `Level_${index}`
		);
		const csv = generateCsv(headers, results);
		return csv;
	} catch (e) {
		console.error(e);
		return null;
	}
}

/**
 * This function takes a nested tree structure (in JSON format) and converts it to a flattened array of objects.
 * Additionally, it computes the depth information of the tree, returning the keys with the longest depth.
 *
 * @param tree - The nested tree structure that needs to be converted.
 *
 * @returns An object containing two properties:
 *   1. result: An array of objects representing the flattened tree structure, where each object contains key-value pairs corresponding to node information.
 *   2. depthInfo: An array holding the keys from the tree that have the longest depth, providing insight into the tree's complexity and structure.
 */
function treeToCsv(tree: GraphResource | GraphResource[]): {
	results: { [key: string]: string }[];
	depthInfo: DepthInfoType;
} {
	const results: { [key: string]: string }[] = [];
	const depthInfo: DepthInfoType = { maxDepth: 0 };

	const stack: { node: GraphResource; parentPath: string[] }[] =
		Array.isArray(tree)
			? tree.reverse().map((node) => ({ node, parentPath: [] }))
			: [{ node: tree, parentPath: [] }];

	while (stack.length > 0) {
		const { node, parentPath } = stack.pop()!;
		if (node === null) continue;

		const currentPath = [...parentPath, node.label];
		if (currentPath.length > depthInfo.maxDepth) {
			depthInfo.maxDepth = currentPath.length;
		}

		const row: { [key: string]: string } = {};
		currentPath.forEach((item, index) => {
			row[`Level_${index}`] = item;
		});
		results.push(row);

		if (node.children && node.children.length > 0) {
			for (const child of [...node.children].reverse()) {
				stack.push({ node: child, parentPath: currentPath });
			}
		}

		// If node has content.questionList, treat it as additional children
		if (
			node.content &&
			node.content.questionList &&
			node.content.questionList.length > 0
		) {
			for (const question of node.content.questionList.reverse()) {
				// Assuming questionList contains objects similar to GraphResource
				stack.push({ node: question, parentPath: currentPath });
			}
		}
	}

	return { results, depthInfo };
}

/**
 * This function takes an array of objects and converts it to a CSV formatted string. The CSV columns
 * are determined by the specified object keys (headers) and each object in the array represents a row in
 * the resulting CSV string.
 *
 * @param headers - An array of strings representing the keys to be used as headers in the CSV file.
 *
 * @param results - An array of objects where each object represents a record in the CSV.
 *
 * @returns  A string formatted as a CSV.
 */
function generateCsv(
	headers: string[],
	results: { [key: string]: string }[]
): string {
	const linesSet = new Set<string>();
	const csv = results.reduce((acc, row) => {
		const currentLine = headers
			.map((val) => {
				if (Object.prototype.hasOwnProperty.call(row, val)) {
					const cellValue = row[val];
					const formattedCellValue = cellValue?.includes(",")
						? `"${cellValue.replace(/"/g, '""')}"`
						: cellValue;
					return formattedCellValue ?? "";
				} else {
					return "";
				}
			})
			.join(",");

		if (!linesSet.has(currentLine)) {
			linesSet.add(currentLine);
			return acc + currentLine + "\n";
		}
		return acc;
	}, headers.join(",") + "\n");

	return csv;
}
