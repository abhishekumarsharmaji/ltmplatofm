import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lmsRouter from "./lms";
import marketplaceRouter from "./marketplace";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lmsRouter);
router.use(marketplaceRouter);

export default router;
