/** Stores unique ids */
const CHEMHUB_UQ_UNIQUE_IDS: { [id: string]: boolean } = {};

export function getUniqueId(): string {
	const id: string = uuidv4();
	if (CHEMHUB_UQ_UNIQUE_IDS[id] === undefined) {
		CHEMHUB_UQ_UNIQUE_IDS[id] = true;
		return id;
	}
	return getUniqueId();
}

const uuidv4 = () => {
	return "Qxxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
		/[xy]/g,
		function (c) {
			const r = (Math.random() * 16) | 0,
				v = c == "x" ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		}
	);
};
