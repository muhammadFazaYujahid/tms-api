import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Sequelize } from "sequelize";
import { Organization, TaskCommentHistory, User } from "../models/index.js";
import sendEmail from "../utils/sendEmail.js";
import { upload } from "../middleware/Multer.js";
import multer from "multer";
import { UserHasNotif, UserHasOrg } from "../models/User.js";
import { io } from "../utils/socket.js";
import path from "path";

export const register = async (req, res, next) => {
    const { email } = req.body;
    try {
        const checkEmail = await User.findOne({
            where: { email: email, },
        });
        if (checkEmail) {
            return res.status(409).json({
                success: false,
                message: "email already used"
            });
        }
        const password = crypto.randomBytes(4).toString("hex");
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const organization = await Organization.create({
            org_key: "ORG-" + crypto.randomBytes(2).toString("hex"),
            organization_name: email.split('@')[0] + "_org",
        });

        const user = await User.create({
            user_key: 'USR-' + crypto.randomBytes(2).toString("hex"),
            username: email.split('@')[0],
            email: email.toLowerCase(),
            password: hashedPassword,
            // role: 'owner',
            email_token: crypto.randomBytes(64).toString("hex"),

            //later will deleted
            org_key: organization.org_key,
        });
        const userOrg = await UserHasOrg.create({
            user_key: user.user_key,
            org_key: organization.org_key,
            role: 'superadmin'
        })
        let subject = "Verify your email";
        let content = `
            <div style="max-width:520px;margin:0 auto">
                <div style="vertical-align:top;text-align:left;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;font-size:14px;font-weight:400;letter-spacing:-0.005em;color:#091e42;line-height:20px;">
                    <h1 style="margin-bottom:0;font-size:24px;font-weight:500;letter-spacing:-0.01em;color:#172b4d;line-height:28px;margin-top:40px">
                        You're nearly there!</h1>
                    <p style="color:#091e42;line-height:20px;margin-top:12px">Hi ${user.username},</p>
                    <p style="color:#091e42;line-height:20px;margin-top:12px">Please verify your mail to continue...</p>
                    <a href="${process.env.FRONTEND_LINK}/auth/setup-account?invited=true&token=${user.email_token}"
                        style="box-sizing:border-box;border-radius:3px;border-width:0;border:none;display:inline-flex;font-style:normal;font-size:inherit;line-height:24px;margin:0;outline:none;padding:4px 12px;text-align:center;vertical-align:middle;white-space:nowrap;text-decoration:none;background:#0052cc;color:#ffffff;">
                        Verify your email</a>
                </div>
            </div>
            `;
        sendEmail(email, subject, content);
        res.status(201).json({
            success: true,
            message: "Register Success",
            data: user.email,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }

};

export const login = async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({
            where: {
                email: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("email")),
                    Sequelize.fn("LOWER", email)
                ),
            },
            // include: [{
            //     model: Organization,
            //     attributes: ['org_key'],
            //     as: 'org_data'
            // }]
            // include: [{
            //     model: UserHasOrg,
            //     attributes: ['role'],
            //     as: 'user_org',
            // }]
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "There is no user with this email",
            });
        }
        const userOrg = await UserHasOrg.findOne({
            where: {
                user_key: user.user_key
            }
        })
        // if (userOrg) {
        //     const orgData = await Organization.findO
        // }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: "Incorrect password",
            });
        }
        const payload = {
            id: user.id,
            user_key: user.user_key,
            role: user.role,
            user: user
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            // expiresIn: 24 * 17 * 60 * 60 * 60,
        });
        req.session.token = token;
        res.cookie("access_token", token, {
            httpOnly: true,
            // maxAge: 24 * 17 * 60 * 60 * 60,
        });
        res.status(201)
            .json({
                success: true,
                message: "Login successfully",
                email: user.email,
                user_key: user.user_key,
                username: user.username,
                user_photo: user.photo,
                org: userOrg.org_key,
                user_role: userOrg.role,
                token: token,
            });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const Me = async (req, res, next) => {
    try {
        const user = await User.findOne({
            attributes: ['user_key', "username", "email", "photo"],
            where: {
                id: req.userId,
            },
            include: [{
                model: UserHasOrg,
                attributes: ['org_key', 'role']
            }]
        });
        let orgData = [];
        await Promise.all(
            user.user_has_orgs.map(async (data) => {
                const getOrg = await Organization.findOne({
                    where: {
                        org_key: data.org_key,
                    }
                });
                orgData.push({ user_key: data.user_key, org_key: data.org_key, role: data.role, org_name: getOrg.organization_name })
            })
        )

        io.emit('get-profile', 'you are getting your profile');

        user.setDataValue('orgData', orgData);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            success: true,
            message: "Profile",
            data: user,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const my_photo = async (req, res, next) => {
    try {
        const user = await User.findOne({
            attributes: ["photo"],
            where: {
                id: req.userId,
            },
        });
        const imagePath = path.join(process.cwd(), 'public', 'avatars', user.photo);
        res.sendFile(imagePath);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const getNotif = async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.userId } });
        const getNotif = await UserHasNotif.findAll({ where: { target_key: user.user_key }, order: [['createdAt', 'DESC']], });
        const notifData = [];
        await Promise.all(
            getNotif.map(async (notif) => {
                if (notif.type == 'task') {
                    const taskActivity = await TaskCommentHistory.findOne({
                        where: { id: notif.notif_id },
                        include: [{
                            model: User,
                            attributes: ['username']
                        }]
                    })
                    notifData.push(taskActivity)
                }
            })
        )

        res.status(200).json({
            success: true,
            message: "success",
            data: notifData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const logOut = async (req, res, next) => {
    const loggedIn = req.cookies.access_token;
    try {
        if (loggedIn) {
            res.clearCookie("access_token");
            res.status(200).json({
                success: true,
                message: "Successed logout",
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Not logged in yet",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const checkCookies = async (req, res, next) => {
    const loggedIn = req.cookies.access_token;
    try {
        if (loggedIn) {
            res.status(200).json({
                success: true,
                message: "has logged in",
            });
        } else {
            res.status(401).json({
                success: false,
                message: "Not logged in yet",
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const requestResetPassword = async (req, res, next) => {
    const { email } = req.body;
    try {
        const checkEmail = await User.findOne({
            where: { email: email, },
        });
        if (!checkEmail) {
            return res.status(409).json({
                success: false,
                message: "email not founds"
            });
        }
        const passwordToken = crypto.randomBytes(64).toString("hex")

        const user = await User.update({
            reset_password_token: passwordToken,
        }, { where: { user_key: checkEmail.user_key } });
        let subject = "Reset Password";
        let content = `
            <div style="max-width:520px;margin:0 auto">
                <div style="vertical-align:top;text-align:left;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;font-size:14px;font-weight:400;letter-spacing:-0.005em;color:#091e42;line-height:20px;">
                    <h1 style="margin-bottom:0;font-size:24px;font-weight:500;letter-spacing:-0.01em;color:#172b4d;line-height:28px;margin-top:40px">
                        Reset Password</h1>
                    <p style="color:#091e42;line-height:20px;margin-top:12px">Hi ${checkEmail.username},</p>
                    <p style="color:#091e42;line-height:20px;margin-top:12px">Click this button bellow to reset your password</p>
                    <a href="${process.env.FRONTEND_LINK}/auth/reset-password?token=${passwordToken}"
                    style="box-sizing:border-box;border-radius:3px;border-width:0;border:none;display:inline-flex;font-style:normal;font-size:inherit;line-height:24px;margin:0;outline:none;padding:4px 12px;text-align:center;vertical-align:middle;white-space:nowrap;text-decoration:none;background:#0052cc;color:#ffffff;">
                    Verify your email</a>
                    <p style="color:#091e42;line-height:20px;margin-top:12px">if you never ask to reset password, ignore this message. we also recommend changing your password in the profile settings</p>
                </div>
            </div>
            `;
        sendEmail(email, subject, content);
        res.status(201).json({
            success: true,
            message: "Reset Password email has been send",
            data: user.email,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}