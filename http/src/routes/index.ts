import express from "express";
import userRoute from "./user";
import { sumbitCode } from "../controller/sumbissionController";

const router = express.Router();

router.use("/auth", userRoute);
router.use("/sumbit", sumbitCode);

export default router;
