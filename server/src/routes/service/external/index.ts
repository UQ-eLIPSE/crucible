import * as express from "express";

// Subrouters
import lti from "./lti";

// =============================================================================

const router = express.Router();

router.use("/lti", lti);

export default router;
