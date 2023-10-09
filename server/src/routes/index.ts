import * as express from "express";
import { noCacheResponse } from "../middleware/index";

// Subrouters
import {
	redirectToLogin,
	informParentWindowOfSuccess,
	testSsoToken,
} from "./uqsso";
import api from "./api";
import service from "./service";

// =============================================================================

const router = express.Router();

router
	.get("/_uqsso/login", noCacheResponse(), redirectToLogin)
	.get(
		"/_uqsso/return/success",
		noCacheResponse(),
		informParentWindowOfSuccess
	)
	.get("/_uqsso/test", noCacheResponse(), testSsoToken)

	.use("/service", service)
	.use("/api", api);

export default router;
