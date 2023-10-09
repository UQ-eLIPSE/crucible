interface ViewportModeDescription {
	readonly mediaQuery: string;
	readonly label: string;
	readonly minWidth: number;
	readonly maxWidth: number;
}

interface ViewportSet {
	[mode: number]: ViewportModeDescription;
}

export enum ViewportMode {
	Mobile,
	Tablet,
	Desktop,
}

export const Viewports: ViewportSet = {
	[ViewportMode.Mobile]: {
		mediaQuery: "(max-width: 500px)",
		label: "mobile",
		minWidth: 0,
		maxWidth: 500,
	},
	[ViewportMode.Tablet]: {
		mediaQuery: "(min-width: 501px) and (max-width: 1100px)",
		label: "tablet",
		minWidth: 501,
		maxWidth: 1100,
	},
	[ViewportMode.Desktop]: {
		mediaQuery: "(min-width: 1101px)",
		label: "desktop",
		minWidth: 1101,
		maxWidth: Infinity,
	},
};

export function testViewportMode(mode: ViewportMode) {
	return window.matchMedia(Viewports[mode].mediaQuery).matches;
}
