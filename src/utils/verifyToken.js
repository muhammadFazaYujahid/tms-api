import jwt from "jsonwebtoken";
import { errors } from "./error.js";

export const veryToken = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return next(errors(401, "you are not authentication"));
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return next(errors(403, "token is not valid"));
        }
        req.user = user;
        next();
    });
};
