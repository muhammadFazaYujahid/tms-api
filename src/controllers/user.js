import bcrypt from "bcrypt";
import crypto from "crypto";
import { Op, Sequelize } from "sequelize";
import { Project, TaskHandler, User } from "../models/index.js";
import sendEmail from "../utils/sendEmail.js";
import { upload } from "../middleware/Multer.js";
import multer from "multer";
import { UserHasOrg } from "../models/User.js";
import { MemberHasProject, Workspace, WorkspaceMember } from "../models/Workspace.js";


export const getUser = async (req, res, next) => {
    const { email, org_key } = req.query;
    try {
        if (email != '') {
            const userKeys = await UserHasOrg.findAll({
                where: {
                    org_key: org_key,
                },
                attributes: ['user_key'],
                raw: true,
            });

            const users = await User.findAll({
                where: {
                    user_key: {
                        [Sequelize.Op.notIn]: userKeys.map((user) => user.user_key),
                    },
                    email: {
                        [Op.like]: `%${email}%`
                    }
                },
            });
            return res.status(200).json({
                success: true,
                message: "get user success",
                data: users,
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

export const inviteUser = async (req, res, next) => {
    const { users, role, org_key } = req.body;
    try {

        const addByEmail = users.filter((data) => data.user_key === 'no_key');
        const addByUserKey = users.filter((data) => data.user_key !== 'no_key');
        const allUser = [];

        const password = crypto.randomBytes(4).toString("hex");
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const invitationUser = await User.findOne({
            where: { id: req.userId },
        });
        Promise.all(
            addByEmail.map(async (user) => {
                const checkEmail = await User.findOne({
                    where: {
                        email: user.email
                    },
                });
                if (checkEmail) {
                    return res.status(409).json({ success: false, message: "email already registered" });
                }
                const newUser = await User.create({
                    user_key: 'USR-' + crypto.randomBytes(2).toString("hex"),
                    username: user.email.split('@')[0],
                    email: user.email.toLowerCase(),
                    password: hashedPassword,
                    // role: role,
                    email_token: crypto.randomBytes(64).toString("hex"),

                    //will be deleted
                    org_key: invitationUser.org_key,
                });
                if (newUser) {
                    const userOrg = await UserHasOrg.create({
                        user_key: newUser.user_key,
                        org_key: invitationUser.org_key,
                        role: role
                    })
                }
                let subject = `${invitationUser.username} is waiting for you to join them`;
                let content = `
                    <div style="max-width:520px;margin:0 auto">
                        <div style="vertical-align:top;text-align:left;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;font-size:14px;font-weight:400;letter-spacing:-0.005em;color:#091e42;line-height:20px;">
                        <h1 style="margin-bottom:0;font-size:24px;font-weight:500;letter-spacing:-0.01em;color:#172b4d;line-height:28px;margin-top:40px">Your team is waiting for you to join them</h1>
                        <h3 style="font-size:16px;font-weight:500;letter-spacing:-0.006em;color:#172b4d;line-height:20px;margin: top 5px;padding:0">${invitationUser.username} has invited you to collaborate</h3>
    
                        <a href="http://localhost:3000/auth/setup-account?invited=true&token=${newUser.email_token}"
                            style="box-sizing:border-box;border-radius:3px;border-width:0;border:none;display:inline-flex;font-style:normal;font-size:inherit;line-height:24px;margin:0;outline:none;padding:4px 12px;text-align:center;vertical-align:middle;white-space:nowrap;text-decoration:none;background:#0052cc;color:#ffffff;">
                            Join the team</a>
    
                        <p style="color:#091e42;line-height:20px;margin-top:12px">Here's what ${invitationUser.username} and your team are using to work seamlessly and accomplish more,</p>
                        </div>
                    </div>
                    `;
                sendEmail(user.email, subject, content);
            }),
            addByUserKey.map(async (user) => {

                const userOrg = await UserHasOrg.create({
                    user_key: user.user_key,
                    org_key: invitationUser.org_key,
                    role: role
                })
            })
        )

        // if (user.user_key == 'no_key') {
        //     const email = user.username;



        // } else {

        // }
        return res.status(201).json({
            success: true,
            message: "Successed invite",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const verify = async (req, res, next) => {
    try {
        const user = await User.findOne({
            where: { email_token: req.query.token },
        });
        if (user) {
            user.email_token = null;
            user.verified = true;
            await user.save((err) => {
                if (err) {
                    res.status(500).json({ message: err });
                    return;
                }
            });
            res.status(200).json({
                success: true,
                message: "successed verified",
                data: user.username,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Already verified",
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

export const setupAccount = async (req, res, next) => {
    const { username, password, token, email, invited } = req.body;
    try {

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        if (invited == 'true') {
            const user = await User.findOne({
                where: { email_token: token },
            });
            if (user) {
                user.username = username;
                user.password = hashedPassword;
                user.email_token = null;
                user.verified = true;
                await user.save((err) => {
                    if (err) {
                        res.status(500).json({ message: err });
                        return;
                    }
                });
                res.status(200).json({
                    success: true,
                    message: "successed verified",
                    data: user.username,
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: "Already verified",
                });
            }
        } else {
            console.log('you are not invited');
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const ResetPassword = async (req, res, next) => {
    const { password, passwordToken } = req.body;
    try {

        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const user = await User.findOne({
            where: { reset_password_token: passwordToken },
        });
        if (user) {
            user.password = hashedPassword;
            user.reset_password_token = null;
            await user.save((err) => {
                if (err) {
                    res.status(500).json({ message: err });
                    return;
                }
            });
            res.status(200).json({
                success: true,
                message: "Reset Password Success",
                data: user.username,
            });
        } else {
            res.status(400).json({
                success: false,
                message: "Reset Password Failed",
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

export const verifyInvite = async (req, res, next) => {
    upload("avatar")(req, res, async (err) => {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        } else if (err) {
            if (err.code === "FILE_TYPE_NOT_ALLOWED") {
                return res.status(400).json({
                    success: false,
                    message: "File type not allowed",
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        }
        const { path } = req.file;
        const { username, password } = req.body;
        try {
            const checkUsername = await User.findOne({
                where: {
                    username: Sequelize.where(
                        Sequelize.fn("LOWER", Sequelize.col("username")),
                        Sequelize.fn("LOWER", username)
                    ),
                },
            });
            if (checkUsername) {
                return res.status(409).json({
                    success: false,
                    message: "Username already",
                });
            }
            const user = await User.findOne({
                where: { email_token: req.query.continue },
            });
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(password, salt);
            if (user) {
                user.user_key = `USER-${user.id}`;
                user.username = username;
                user.password = hash;
                user.photo = path;
                user.email_token = null;
                user.verified = true;
                await user.save((err) => {
                    if (err) {
                        res.status(500).json({ success: false, message: err });
                        return;
                    }
                });
                res.status(201).json({
                    success: true,
                    message: "Successed created account",
                    data: user.email,
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: "Already verified",
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    });
};

export const editProfile = async (req, res, next) => {
    upload("avatar")(req, res, async (err) => {

        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        } else if (err) {
            if (err.code === "FILE_TYPE_NOT_ALLOWED") {
                return res.status(400).json({
                    success: false,
                    message: "File type not allowed",
                });
            }
            return res.status(400).json({
                success: false,
                message: err.message,
            });
        } else {
            try {
                const { user_key, username, oldPhoto } = req.body;
                let photo = '';
                if (req.file == undefined) {
                    photo = oldPhoto
                } else {
                    photo = req.file.filename;
                }
                await User.update({ username: username, photo: photo }, { where: { user_key: user_key } });
                res.status(200).json({
                    success: true,
                    message: "Profile changed successfully",
                });
            } catch (error) {
                res.status(500).json({
                    success: false,
                    message: "Internal Server Error",
                    error: error.message,
                });
            }
        }
    })
};

export const changePassword = async (req, res, next) => {
    const { old_password, password } = req.body;
    try {
        const user = await User.findOne({
            where: { id: req.userId },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const isOldPassword = await bcrypt.compare(old_password, user.password);
        if (!isOldPassword) {
            return res.status(400).json({ message: "Invalid old password" });
        }
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        await user.update({ password: hash });
        res.clearCookie("access_token");
        res.status(200).json({
            success: true,
            message: "Password changed successfully",
            data: "Please login again",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
export const changeEmail = async (req, res, next) => {
    const { email } = req.body;
    const id = req.userId;
    try {
        const user = await User.findOne({
            where: { id: id },
        });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const checkEmail = await User.findOne({
            where: {
                email: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("email")),
                    Sequelize.fn("LOWER", email)
                ),
            },
        });
        if (checkEmail) {
            return res.status(409).json({
                success: false,
                message: "Email already",
            });
        }
        await user.update({ email: email });
        res.status(200).json({
            success: true,
            message: "Email changed successfully",
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

export const getUserDetail = async (req, res, next) => {
    const { user_key } = req.query;
    try {
        const user = await User.findOne({
            where: { user_key: user_key },
            attributes: ['user_key', 'email', 'username', 'photo'],
        })
        const workspace = await WorkspaceMember.findOne({
            where: { user_key: user.user_key },
            attributes: ['work_key'],
            include: [{
                model: Workspace,
                attributes: ['workspace_name']
            }]
        })
        user.setDataValue('workspace', workspace);

        res.status(200).json({
            success: true,
            message: "success",
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

export const getMemberTask = async (req, res, next) => {
    const { user_key } = req.query;
    try {
        const handler = await TaskHandler.findAll({
            where: { handler: user_key },
            attributes: ['task_key', 'type', 'handler']
        })
        res.status(200).json({
            success: true,
            message: "success",
            data: handler,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getMemberProject = async (req, res, next) => {
    const { user_key } = req.query;
    try {
        const members = await WorkspaceMember.findOne({
            where: { user_key: user_key },
            attributes: ['member_key']
        })
        const getProjectKey = await MemberHasProject.findAll({ where: { member_key: members.member_key }, attributes: ['project_key'] });
        const projectKey = getProjectKey.map(project => project.project_key);

        const project = await Project.findAll({
            where: {
                project_key: {
                    [Op.in]: projectKey
                }
            }
        })

        res.status(200).json({
            success: true,
            message: "success",
            data: project,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
