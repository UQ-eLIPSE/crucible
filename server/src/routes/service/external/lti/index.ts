import * as express from "express";

// Middleware
import { noCacheResponse, parseIdAsObjectId } from "../../../../middleware";

// Handlers
import { generateLtiLaunchForm } from "./launch";

// =============================================================================

const router = express.Router();

router
	// All LTI things are not to be cached, and have immediate expiration
	.use(noCacheResponse())

	// Generate a self-submitting LTI launch form
	.get("/launch/:id", parseIdAsObjectId(), generateLtiLaunchForm);

export default router;
