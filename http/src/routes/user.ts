import express from "express";
import { Login, Signup } from "../controller/userController";
import { validateSchema } from "../middleware/validateData";
import { UserLoginSchema, UserSignupSchema } from "../schema/user";

const userRoute = express.Router();

userRoute.post("/login", validateSchema(UserLoginSchema), Login);

userRoute.post("/signup", validateSchema(UserSignupSchema), Signup);

export default userRoute;
