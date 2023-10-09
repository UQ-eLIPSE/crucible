import * as express from "express";

// Middleware
import { noCacheResponse, checkUserSessionExists } from "../../../middleware";

// Handlers
import { changePassword } from "./password";

// =============================================================================

const router = express.Router();

router
	// All user things are not to be cached, and have immediate expiration
	.use(noCacheResponse())

	// Everything below here must have a user session set
	.use(checkUserSessionExists())

	// Change password
	.patch("/:id/password", changePassword);

export default router;
