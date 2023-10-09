import * as express from "express";

// Middleware
import {
	noCacheResponse,
	localStrategyAuthenticate,
	checkUserSessionExists,
	authenticateSSOUser
} from "../../../middleware";

// Handlers
import { logout } from "./logout";
import { whoami, ssoLogin } from "./whoami";

// =============================================================================

const router = express.Router();

router
	// All auth things are not to be cached, and have immediate expiration
	.use(noCacheResponse())

	// Login
	// Process auth via. local strategy, then send back user info
	.get("/login/sso", authenticateSSOUser, ssoLogin)
	
	
	.post("/login/local", localStrategyAuthenticate(), whoami)
	// Everything below here must have a user session set
	.use(authenticateSSOUser, checkUserSessionExists())
	.get("/whoami", whoami)

	// Logout
	.post("/logout", logout)

export default router;
