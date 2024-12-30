import express from "express";
import { sumbitCode } from "../controller/sumbissionController";
import { authenticateToken } from "../middleware/userAuth";

const sumbitCodeRouter = express.Router();

sumbitCodeRouter.post("/code", authenticateToken(), sumbitCode);

export default sumbitCodeRouter;
