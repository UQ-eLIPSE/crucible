interface Config {
	DATABASE: {
		URI: string;
	};
	SERVER: {
		PORT: number;
	};
	CLIENT: {
		ADDRESS: string;
	};
	MANTA: {
		ENABLED: boolean;
		HOST_URL: string;
		HOST_FOLDER: string;
		UPLOAD_SUBFOLDER: {
			CONTENT: string;
			THUMBNAIL: string;
			EDITOR_IMAGES: string;
		};
		KEY_PATH: string;
		KEY_ID: string;
		USER: string;
		SUBUSER: string | null;
		ROLES: string[];
	};
	MANTA_OPERATION: {
		JOB_CHECK_TRIES: number;
	};
	AUTH: {
		SESSION_SECRET: string;
		PASSWORD_HASH_ROUNDS: number;
		UQSSO_SERVER_DOMAIN: string;
		UQSSO_SERVER_PROTOCOL: "http" | "https";
	};
	SESSION: {
		COLLECTION: string;
		EXPIRATION_TIME: number;
	};
}

const environment = process.env.NODE_ENV || "development";
// Disabled next line as no other way to dynamically import
// the config without using require
// eslint-disable-next-line @typescript-eslint/no-var-requires
const config: Config = require(`${__dirname}/../../config/${environment}.json`);

export function getEnvironment() {
	return environment;
}

export function getConfig() {
	return config;
}
