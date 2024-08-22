import { UserHasOrg } from "../models/User.js";
import { Organization, User, Team, TeamMember, Workspace, Client, Project, TaskHandler } from "../models/index.js";
import Sequelize, { Op } from 'sequelize';
import crypto from "crypto";
import { MemberHasProject, WorkspaceMember } from "../models/Workspace.js";
import { upload } from "../middleware/Multer.js";
import multer from "multer";
import path from "path";
import bcrypt from "bcrypt";

export const getOrgByKey = async (req, res, next) => {
    try {
        // console.log('isi req', req.query.orgKey);
        const { orgKey } = req.query
        const orgData = await Organization.findOne({
            where: { org_key: orgKey },
            attributes: ["org_key", "organization_name", 'org_logo'],
            include: [
                {
                    model: User,
                    attributes: ["user_key", "username", "email", "photo"],
                },
            ],
        });

        res.status(200).json({
            success: true,
            message: "Get org successfully",
            data: orgData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const editOrgDetail = async (req, res, next) => {
    upload("org_logo")(req, res, async (err) => {

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
                const { org_key, organization_name, oldPhoto } = req.body;
                let photo = '';
                if (req.file == undefined) {
                    photo = oldPhoto
                } else {
                    photo = req.file.filename;
                }
                const org = await Organization.update({ org_key, organization_name, org_logo: photo }, { where: { org_key: org_key } })
                res.status(200).json({
                    success: true,
                    message: "Org Detail changed successfully",
                    data: {...req.body, photo}
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


export const getOrgLogo = async (req, res, next) => {
    try {
        const { org_key } = req.query;
        console.log('aoajah', org_key)
        const org = await Organization.findOne({
            attributes: ["org_logo"],
            where: {
                org_key: org_key,
            },
        });
        const imagePath = path.join(process.cwd(), 'public', 'org_logos', org.org_logo);
        res.sendFile(imagePath);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const changeUserRole = async (req, res) => {
    const { user_key, role, org_key } = req.body
    try {
        const user = UserHasOrg.update({role: role}, { where: { user_key: user_key, org_key: org_key } });
        res.status(200).json({
            success: true,
            message: "Success",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const deleteUserFromOrg = async (req, res) => {
    const { user_key, org_key } = req.body
    try {
        const userHasJob = await TaskHandler.findAll({ where: {handler: user_key} })
        if ((userHasJob).length > 0) {
            return res.status(500).json({ message: "User can't be removed. User has responsible for some task, please remove user as task handler first" });
        }
        const user = await UserHasOrg.destroy({ where: { user_key: user_key, org_key: org_key } });
        res.status(200).json({
            success: true,
            message: "Success",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const importUser = async (req, res) => {
    const { users, org_key } = req.body
    try {

        const emails = users.map(user => user.email);
        
        const checkEmail = await User.findOne({
            where: { email: emails, },
        });

        if (checkEmail) {
            return res.status(409).json({
                success: false,
                message: "some email already used"
            });
        }

        const formattedUsers = users.map((user) => {    
            const password = crypto.randomBytes(4).toString("hex");
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password, salt);

            return {
                user_key: 'USR-' + crypto.randomBytes(2).toString("hex"),
                ...user,
                password: hashedPassword,
                org_key: org_key,
                verified: true
            }
        })

        const hasOrgData = formattedUsers.map(user => {
            return {
                user_key: user.user_key,
                org_key: user.org_key,
                role: user.role.toLowerCase().replace(/\s+/g, '')
            }
        })

        const filteredUserField = formattedUsers.map(({user_key, username, email, password, org_key, verified}) => {
            return {
                user_key,
                username,
                email,
                password,
                org_key,
                verified
            }
        })
        
        const importUserData = User.bulkCreate(filteredUserField);
        if (importUserData) {
            UserHasOrg.bulkCreate(hasOrgData);
        }

        res.status(200).json({
            success: true,
            message: "Success",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getOrgByUserId = async (req, res, next) => {
    try {
        const userData = await User.findOne({ where: { id: req.userId }, attributes: ['user_key'] });
        const orgList = await UserHasOrg.findAll({ where: { user_key: userData.user_key } });
        const workspaceList = await WorkspaceMember.findAll({  attributes: ['work_key'] ,where: { user_key: userData.user_key } });
        const projectList = await MemberHasProject.findAll({  attributes: ['project_key'] ,where: { user_key: userData.user_key } });

        await Promise.all(
            orgList.map(async (org) => {
                const organization = await Organization.findOne({ where: { org_key: org.org_key }, attributes: ['organization_name'] });
                org.setDataValue('org_name', organization.organization_name);
                org.setDataValue('listed_workspace', workspaceList);
                org.setDataValue('listed_project', projectList);
            })
        )

        res.status(200).json({
            success: true,
            message: "Get members successfully",
            data: orgList,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
export const listOrganization = async (req, res, next) => {
    try {
        const organization = await Organization.findAll({
            attributes: ["org_key", "organization_name"],
            include: [
                {
                    model: User,
                    attributes: ["username", "email", "role"],
                },
            ],
        });
        res.status(200).json({
            success: true,
            message: "Get members successfully",
            data: organization,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const findOrganization = async (req, res) => {
    const org_key = req.params.org_key;
    try {
        const checkOrg = await Organization.findOne({
            where: { org_key: org_key },
        });
        if (!checkOrg) {
            return res.status(404).json({ message: "Organization not found" });
        }
        const organization = await Organization.findOne({
            where: { org_key: org_key },
            attributes: ["org_key", "organization_name", 'org_logo'],
            include: [
                {
                    model: User,
                    attributes: ["user_key", "username", "email", "role"],
                },
            ],
        });
        res.status(200).json({
            success: true,
            message: "Successed get member",
            data: organization,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const nonTeamMember = async (req, res) => {
    const orgKey = req.query.org_key;
    try {
        const getUserKey = await UserHasOrg.findAll({
            where: {
                org_key: orgKey,
            },
            attributes: ['user_key'],
            group: ['user_key']
        })
        const userData = [];
        await Promise.all(
            getUserKey.map(async (user) => {
                const users = await User.findOne({
                    where: {
                        user_key: user.user_key,
                    },
                    attributes: ['user_key', 'username', 'verified'],
                });
                userData.push(users)
            })
        )
        res.status(200).json({
            success: true,
            message: "Successed get member",
            data: userData,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const searchMember = async (req, res) => {
    const { org_key, email } = req.query
    try {
        const getUserKey = await UserHasOrg.findAll({
            where: {
                org_key: org_key,
            },
            attributes: ['user_key'],
            raw: true,
        })
        // const userData = [];
        const users = await User.findAll({
            where: {
                // user_key: {
                //     [Sequelize.Op.in]: getUserKey.map((user) => user.user_key),
                // },
                email: {
                    [Op.like]: `%${email}%`
                }
            },
            attributes: ['user_key', 'email', 'username', 'verified'],
            include: [{
                model: UserHasOrg,
                attributes: ['org_key']
            }]
        });
        res.status(200).json({
            success: true,
            message: "Successed get member",
            data: users,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// client section start
export const createClient = async (req, res) => {
    const { org_key, client_name, description } = req.body
    try {
        const client_key = "CL-" + crypto.randomBytes(2).toString("hex");
        const create_client = await Client.create({
            client_key: client_key,
            name: client_name,
            description: description,
            org_key: org_key
        })
        res.status(200).json({
            success: true,
            message: "Success",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getClient = async (req, res) => {
    const { org_key } = req.query
    try {
        const client = await Client.findAll({ where: { org_key: org_key } })
        res.status(200).json({
            success: true,
            message: "Success",
            data: client
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const updateClient = async (req, res) => {
    const { client_key, client_name, description } = req.body
    try {
        const edit_client = await Client.update({
            name: client_name,
            description: description,
        }, { where: { client_key: client_key } })
        res.status(200).json({
            success: true,
            message: "Success",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const deleteClient = async (req, res) => {
    const { client_key } = req.params
    try {
        const changeProject = await Project.update({ client_key: null }, { where: { client_key: client_key } });
        if (!changeProject) {
            res.status(500).json({
                success: false,
                message: "Fail Change Client key at Project",
                error: error.message,
            });
        }
        await Client.destroy({ where: { client_key: client_key } })
        res.status(200).json({
            success: true,
            message: "Success",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
// client section end