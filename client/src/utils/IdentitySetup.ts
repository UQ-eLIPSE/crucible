import * as ClientConfig from "../../config.json";

const Config = ClientConfig as any;

export const DefaultConfig = {
	BRANDING: {
		APP_NAME: "Resource Hub",
		HEADER_TEXT: "Welcome to Resource Hub",
	},
};

function setupIdentity() {
	if (!Config.BRANDING || !Config.BRANDING.APP_NAME) {
		document.title = DefaultConfig.BRANDING.APP_NAME;
	} else {
		document.title = Config.BRANDING.APP_NAME;
	}
}

setupIdentity();
