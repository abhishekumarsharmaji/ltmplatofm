import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lmsRouter from "./lms";
import marketplaceRouter from "./marketplace";
import studioRouter from "./studio";
import liveClassesRouter from "./liveClasses";
import digitalProductsRouter from "./digitalProducts";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lmsRouter);
router.use(marketplaceRouter);
router.use(studioRouter);
router.use(liveClassesRouter);
router.use(digitalProductsRouter);

export default router;
