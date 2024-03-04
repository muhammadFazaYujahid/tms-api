import { UserHasOrg } from "../models/User.js";
import { Organization, User, Team, TeamMember, Workspace, Client, Project } from "../models/index.js";
import Sequelize, { Op } from 'sequelize';
import crypto from "crypto";

export const getOrgByUserId = async (req, res, next) => {
    try {
        const userData = await User.findOne({ where: { id: req.userId }, attributes: ['user_key'] });
        const orgList = await UserHasOrg.findAll({ where: { user_key: userData.user_key } });

        await Promise.all(
            orgList.map(async (org) => {
                const organization = await Organization.findOne({ where: { org_key: org.org_key }, attributes: ['organization_name'] });
                org.setDataValue('org_name', organization.organization_name);
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
            attributes: ["org_key", "organization_name"],
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