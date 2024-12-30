import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export const authenticateToken = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("in the auth");
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    jwt.verify(
      token as string,
      process.env.JSONSECRET as string,
      (err, user: any) => {
        if (err)
          return res.status(403).json({ message: "Forbidden: Invalid token" });
        console.log(user);
        req.user = {
          id: user.id,
          email: user.email,
        };
        next();
      }
    );
  };
};
