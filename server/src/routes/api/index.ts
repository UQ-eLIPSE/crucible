import * as express from "express";

// Subrouters
import auth from "./auth";
import resource from "./resource";
import user from "./user";

// =============================================================================

const router = express.Router();

router.use("/auth", auth).use("/resource", resource).use("/user", user);

export default router;
