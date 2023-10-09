import * as express from "express";

// Subrouters
import external from "./external";

// =============================================================================

const router = express.Router();

router.use("/external", external);

export default router;
