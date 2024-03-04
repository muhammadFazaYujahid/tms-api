import express from "express";
import { checkCookies, getNotif, login, logOut, Me, my_photo, register, requestResetPassword } from "../controllers/auth.js";
import { checkAuth, verifyEmail, verifyUser } from "../middleware/authUser.js";

const router = express.Router();

router.post("/register", register);
router.post("/request-reset-password", requestResetPassword);
router.post("/login", verifyEmail, login);
router.get("/me", checkAuth, Me);
router.get("/my-photo", checkAuth, my_photo);
router.get("/get-notif", checkAuth, getNotif);
router.get("/logout", logOut);
router.get("/check-cookies", checkCookies);

export default router;
