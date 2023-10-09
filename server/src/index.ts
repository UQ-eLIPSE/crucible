import * as express from "express";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import * as session from "express-session";
import * as passport from "passport";
import MongoStore = require("connect-mongo");
import { ServeStaticOptions } from "serve-static";

import routes from "./routes";

import { setupSessionSerialisation, setupLocalStrategy } from "./auth";
import { errorHandler } from "./middleware/error";
import { getEnvironment, getConfig } from "./util/Config";
import { Database } from "./database";
import { convertQuiz } from "./util/ConvertQuizzes";
import { addChildrenTags } from "./util/AddTags";

async function main() {
	// Get configuration and environment
	const environment = getEnvironment();
	const config = getConfig();
	const clientPath = `${__dirname}/../../client`;

	// Initialise app
	const app = express();
	await Database.init(config.DATABASE.URI);

	// Enable enable CORS everywhere
	// TODO: Review the need for CORS
	app.use(
		cors({
			credentials: true,
			origin: config.CLIENT.ADDRESS,
		})
	);

	// Serve up client through same server instance
	const expressStaticOptions: ServeStaticOptions = {};

	if (environment === "production") {
		expressStaticOptions.maxAge = 86400000; // 1 day cache
	}

	app.use(express.static(clientPath, expressStaticOptions));

	// Parse cookies
	app.use(cookieParser());

	// Parse JSON request body
	app.use(bodyParser.json());
	app.use(
		bodyParser.urlencoded({
			extended: true,
		})
	);

	// Set Express to use sessions
	app.use(
		session({
			cookie: {
				path: "/api", // Only have cookie sent from client for API calls
			},
			secret: config.AUTH.SESSION_SECRET, // TODO: Set to unguessable secret;
			// Setup Mongo backing store for session management
			store: MongoStore.create({
				// Use value from config, or fallback value
				mongoUrl:
					config?.DATABASE?.URI ||
					"mongodb://localhost:27017/crucible",
				collectionName: config.SESSION.COLLECTION,
				ttl: config.SESSION.EXPIRATION_TIME,
			}),
			saveUninitialized: false,
			resave: false,
		})
	);

	// Passport (auth)
	// Must be located *AFTER* all other Express middleware setup (but before
	// routes)
	app.use(passport.initialize());
	app.use(passport.session());
	setupSessionSerialisation(passport);
	setupLocalStrategy(passport);

	// Attach routes
	app.use("/", routes);

	// Handle errors
	// Must be located *AT THE END* of the handler chain
	app.use(errorHandler());

	// Listen
	app.listen(config.SERVER.PORT);

	// Convert any quizzes to new format
	await convertQuiz();
	// Apply test tags to resources
	await addChildrenTags("Test");

	console.info(`Ready and listening on port ${config.SERVER.PORT}`);
}

// Start
main();
