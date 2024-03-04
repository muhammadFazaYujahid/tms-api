import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export const checkAuth = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return res.status(401).json({ message: "No token" });
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, paload) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        const { id } = paload;
        const user = await User.findOne({
            where: {
                id: id,
            },
        });
        req.userId = user.id;
        req.role = user.role;
        next();
    });
};

export const verifyUser = (req, res, next) => {
    const token = req.cookies.access_token;
    if (!token) {
        return res.status(401).json({ message: "No token" });
    }
    jwt.verify(token, process.env.JWT_SECRET, async (err, paload) => {
        if (err) {
            return res.status(403).json({ message: "Invalid token" });
        }
        const { id } = paload;
        const user = await User.findOne({
            where: {
                uuid: id,
            },
        });
        req.userId = user.uuid;
        req.role = user.role;
        next();
    });
};

export const verifyEmail = async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { email: req.body.email },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not found",
            });
        }
        if (user.verified) {
            next();
        } else {
            res.status(401).json({
                success: false,
                message: "Please check your email to verify account",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};
