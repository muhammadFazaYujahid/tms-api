import { Sequelize, where } from "sequelize";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { User, Workspace, Organization, Team, TeamMember, Project, TaskHandler, Task } from "../models/index.js";
import { key } from "../utils/generateKey.js";
import { MemberHasProject, WorkspaceMember } from "../models/Workspace.js";
import sendEmail from "../utils/sendEmail.js";
import { UserHasOrg } from "../models/User.js";
import { Activity } from "../models/Organization.js";


const createUser = async (userData) => {
    try {
        const email = userData.email;
        const role = userData.role;

        const checkEmail = await User.findOne({
            where: {
                email: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("email")),
                    Sequelize.fn("LOWER", email)
                ),
            },
        });
        if (checkEmail) {
            return { message: "email already used" };
        }
        const invitationUser = await User.findOne({
            where: { id: userData.userId },
        });

        const password = crypto.randomBytes(4).toString("hex");
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const user = await User.create({
            user_key: crypto.randomBytes(2).toString("hex"),
            username: email.split('@')[0],
            email: email.toLowerCase(),
            password: hashedPassword,
            role: role,
            email_token: crypto.randomBytes(64).toString("hex"),
            org_key: invitationUser.org_key,
        });

        let subject = `${invitationUser.username} is waiting for you to join them`;
        let content = `
            <div style="max-width:520px;margin:0 auto">
                <div style="vertical-align:top;text-align:left;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Fira Sans,Droid Sans,Helvetica Neue,sans-serif;font-size:14px;font-weight:400;letter-spacing:-0.005em;color:#091e42;line-height:20px;">
                <h1 style="margin-bottom:0;font-size:24px;font-weight:500;letter-spacing:-0.01em;color:#172b4d;line-height:28px;margin-top:40px">Your team is waiting for you to join them</h1>
                <h3 style="font-size:16px;font-weight:500;letter-spacing:-0.006em;color:#172b4d;line-height:20px;margin: top 5px;padding:0">${invitationUser.username} has invited you to collaborate</h3>

                <a href="http://localhost:3000/auth/setup-account?invited=true&token=${user.email_token}"
                    style="box-sizing:border-box;border-radius:3px;border-width:0;border:none;display:inline-flex;font-style:normal;font-size:inherit;line-height:24px;margin:0;outline:none;padding:4px 12px;text-align:center;vertical-align:middle;white-space:nowrap;text-decoration:none;background:#0052cc;color:#ffffff;">
                    Join the team</a>

                <p style="color:#091e42;line-height:20px;margin-top:12px">Here's what ${invitationUser.username} and your team are using to work seamlessly and accomplish more,</p>
                </div>
            </div>
            `;

        sendEmail(email, subject, content);
        return { message: 'create user success', data: user };
    } catch (error) {
        console.error(error.message);
    }
};

export const createWorkspace = async (req, res, next) => {
    const { workspace_name } = req.body;
    try {
        const user = await User.findOne({
            where: { id: req.userId },
        });
        const workspace = await Workspace.create({
            work_key: "W",
            workspace_name: workspace_name,
            org_key: user.org_key,
        });
        await workspace.update({
            work_key: `${key(workspace_name)}-${workspace.id}`,
        });
        res.status(201).json({
            success: true,
            message: "Successed created workspace",
            data: workspace,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
export const inviteToWorkspace = async (req, res, next) => {
    const { role, users, work_key } = req.body;
    try {
        const sameOrgMember = users.filter((data) => data.sameOrg == true);
        const diffOrgMember = users.filter((data) => data.sameOrg == false);
        const addByMail = diffOrgMember.filter((data) => data.user_key == 'no_key');
        const addByUserKey = diffOrgMember.filter((data) => data.user_key != 'no_key');

        const password = crypto.randomBytes(4).toString("hex");
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync(password, salt);

        const invitationUser = await User.findOne({
            where: { id: req.userId },
        });

        await Promise.all(
            // addByInvite.map(async (user) => {
            //     if (user != undefined) {
            //         const data = { role: req.body.role, email: user.username, userId: req.userId };
            //         const dataUser = await createUser(data);
            //         allUser.push({ user_key: dataUser.data.user_key, username: dataUser.data.username, verified: false });

            //     }
            // }),

            // addByUserKey.map(async (user) => {
            //     allUser.push({ user_key: user.user_key, username: user.username, verified: user.verified })
            // })

            addByMail.map(async (user) => {
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

                    sameOrgMember.push({ user_key: newUser.user_key, email: newUser.email, verified: false, user_has_orgs: [{ org_key: userOrg.org_key }], sameOrg: true });
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


                const addData = await WorkspaceMember.create({
                    member_key: 'MW-' + crypto.randomBytes(2).toString("hex"),
                    user_key: user.user_key,
                    role: role,
                    work_key: work_key
                })
            })
        ).then(() => {
            sameOrgMember.map(async (user) => {
                const addData = await WorkspaceMember.create({
                    member_key: 'MW-' + crypto.randomBytes(2).toString("hex"),
                    user_key: user.user_key,
                    role: role,
                    work_key: work_key
                })

            })
            res.status(201).json({
                success: true,
                message: "Invite success",
                // data: workspace,
            });
        })

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const addMemberToTeam = async (req, res, next) => {
    const { member_key, team_key } = req.body;
    try {
        const updatedData = {
            team_key: team_key
        }
        const member = await WorkspaceMember.update(updatedData, {
            where: { member_key: member_key }
        });
        if (member) {
            res.status(200).json({
                success: true,
                message: "Successed",
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

export const kickMember = async (req, res, next) => {
    const member_key = req.body.member_key;
    try {
        const member = await WorkspaceMember.destroy({
            where: {
                member_key: member_key,
            }
        });
        if (member) {
            res.status(200).json({
                success: true,
                message: "Successed",
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

export const deleteWorkspace = async (req, res, next) => {
    const work_key = req.body.work_key;
    try {
        const workspaceData = await Workspace.destroy({
            where: {
                work_key: work_key,
            }
        });
        if (workspaceData) {

            const member = await WorkspaceMember.destroy({
                where: {
                    work_key: work_key,
                }
            });
            if (member) {
                console.log("member berhasil dihapus");

            }
            res.status(200).json({
                success: true,
                message: "Successed",
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

export const listWorkspace = async (req, res, next) => {
    try {
        const workspaces = await Workspace.findAll({
            where: {
                org_key: req.query.org_key
            },
            include: [{
                model: WorkspaceMember,
                attributes: ['role', 'member_key', 'user_key'],
                include: [{
                    model: User,
                    attributes: ['username', 'photo']
                }]
            }]
        });
        if (!workspaces) {
            return res.status(404).json({
                success: false,
                message: "Workspace doesn't exist yet",
            });
        }
        res.status(200).json({
            success: true,
            message: "Successed",
            data: workspaces,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getWorkspaceActivity = async (req, res, next) => {
    const { work_key } = req.query
    try {
        const activities = await Activity.findAll({ where: { type: 'workspace', related_code: work_key }, order: [['createdAt', 'DESC']] })

        await Promise.all(
            activities.map(async (activity) => {
                const user = await User.findOne({ where: { user_key: activity.user_key }, attributes: ['username'] });
                activity.setDataValue('username', user.username);
            })
        )
        res.status(200).json({
            success: true,
            message: "Successed",
            data: activities,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const WorkspaceDetail = async (req, res, next) => {
    try {
        const workspaces = await Workspace.findAll({
            attributes: ["work_key", "workspace_name"],
        });
        if (!workspaces) {
            return res.status(404).json({
                success: false,
                message: "Workspace doesn't exist yet",
            });
        }
        res.status(200).json({
            success: true,
            message: "Successed",
            data: workspaces,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getMember = async (req, res, next) => {
    try {
        const member = await WorkspaceMember.findAll({
            where: { work_key: req.query.work_key },
            attributes: ['member_key', 'role', 'team_key', 'user_key'],
            include: [{
                model: User,
                attributes: ['username', 'photo']
            },
            {
                model: Team,
                attributes: ['team_name']
            }]
        });
        res.status(200).json({
            success: true,
            message: "Successed",
            data: member,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const findMemberWorkspace = async (req, res, next) => {
    const work_key = req.params.work_key;
    try {
        const workspace = await Workspace.findOne({
            where: {
                work_key: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("work_key")),
                    Sequelize.fn("LOWER", work_key)
                ),
            },
            attributes: ["work_key", "workspace_name"],
            include: [
                {
                    model: Organization,
                    attributes: ["org_key", "organization_name"],
                    include: [
                        {
                            model: User,
                            attributes: ["username", "email", "role"],
                        },
                    ],
                },
            ],
        });
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Successed",
            data: workspace,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
export const findWorkspace = async (req, res, next) => {
    const work_key = req.params.work_key;
    try {
        const workspace = await Workspace.findOne({
            where: {
                work_key: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("work_key")),
                    Sequelize.fn("LOWER", work_key)
                ),
            },
            attributes: ["work_key", "workspace_name"],
            include: [
                {
                    model: Team,
                    attributes: ["team_key", "team_name"],
                    include: [
                        {
                            model: TeamMember,
                            attributes: ["member_key", "role"],
                            include: [
                                {
                                    model: User,
                                    attributes: ["username"]
                                }
                            ]
                        }
                    ]
                },
            ],
        });
        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Successed",
            data: workspace,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const findMemberByWorkspace = async (req, res, next) => {
    try {
        // const member = await WorkspaceMember.findAll({
        //     where: { work_key: req.query.work_key },
        //     attributes: ['member_key', 'role', 'user_key', 'team_key'],
        //     include: [
        //         {
        //             model: User,
        //             attributes: ['username', 'photo']
        //         },
        //         {
        //             model: Team,
        //             attributes: ['team_name']
        //         }
        //     ]
        // })

        const teams = await Team.findAll({
            attributes: ["team_key", "team_name", "work_key"],
            where: { work_key: req.query.work_key },
            include: [{
                model: WorkspaceMember,
                required: false,
                attributes: ['member_key', 'role'],
                include: [{
                    model: User,
                    attributes: ['username', 'photo']
                }]
            }]
        });
        const noTeamMember = await WorkspaceMember.findAll({
            attributes: ['member_key', 'role'],
            where: {
                work_key: req.query.work_key,
                team_key: null
            },
            include: [{
                model: User,
                attributes: ['user_key', 'username']
            }]
        })
        const noTeam = { team_key: 'no_key', team_name: 'No Team', workspace_members: noTeamMember };
        // const noTeamMember = member.filter((user) => user.team == null)
        let allMember = [];
        Promise.all(
            teams.map((member) => allMember.push({ team_key: member.team_key, team_name: member.team_name, work_key: teams.work_key, workspace_members: member.workspace_members })),
            allMember.push(noTeam)

        );
        res.status(200).json({
            success: true,
            message: "Successed",
            data: allMember,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const workspaceMemberReport = async (req, res, next) => {
    const { work_key } = req.query;
    try {
        const members = await WorkspaceMember.findAll({
            where: { work_key: work_key },
            include: [
                {
                    model: User,
                    attributes: ['username'],
                }
            ]
        })
        await Promise.all(
            members.map(async (member) => {
                const countProject = await MemberHasProject.findAll({ where: { member_key: member.member_key } });
                member.setDataValue('project_count', countProject.length);

                const getTasks = await TaskHandler.findAll({
                    where: { handler: member.user_key },
                    attributes: ['task_key']
                })
                member.setDataValue('taskKeys', getTasks.map(task => task.task_key));
            })
        )

        res.status(200).json({
            success: true,
            message: "Successed",
            data: members,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getMemberRole = async (req, res, next) => {
    try {
        const user = await User.findOne({ where: { id: req.userId } });

        const memberData = await WorkspaceMember.findOne({ where: { user_key: user.user_key } });

        res.status(200).json({
            success: true,
            message: "Successed",
            data: memberData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const editWorkspace = async (req, res, next) => { };
