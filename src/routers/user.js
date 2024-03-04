import express from "express";
import {
    ResetPassword,
    changeEmail,
    changePassword,
    editProfile,
    inviteUser,
    setupAccount,
    verify,
    verifyInvite,
} from "../controllers/user.js";
import { checkAuth } from "../middleware/authUser.js";
import { createActivity } from "../utils/userActivity.js";

const router = express.Router();

router.get("/verify", verify);
// router.post("/verify-invite", verifyInvite);
router.post("/invite-user", [checkAuth, createActivity], inviteUser);
router.post("/edit-profile", editProfile);

router.post("/setup-account", setupAccount);
router.post("/reset-password", ResetPassword);

router.put("/password", checkAuth, changePassword);
router.put("/email", checkAuth, changeEmail);

export default router;
