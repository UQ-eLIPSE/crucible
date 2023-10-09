import type { IResource_FromServer } from "../types/Resource";
import { ViewportMode } from "../utils/Viewports";

export type State = {
	session: Session | undefined;
	clipboard: Clipboard;
	viewport: ViewportMode | undefined;
};

export interface Session {
	_id: string;
	username: string;
}

export interface Clipboard {
	item?: IResource_FromServer;
	multipleItems?: IResource_FromServer[];
	operation: "cut" | "copy" | "unset";
}

// =============================================================================

export function newState() {
	const state: State = {
		session: undefined,
		clipboard: {
			item: undefined,
			multipleItems: undefined,
			operation: "unset",
		},
		viewport: undefined,
	};

	return state;
}
