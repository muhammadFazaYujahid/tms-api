import { Op, Sequelize, where } from "sequelize";
import {
    Organization,
    Project,
    Team,
    TeamHasProject,
    TeamMember,
    User,
    Workspace,
} from "../models/index.js";
import crypto from "crypto";
import { key } from "../utils/generateKey.js";
import { MemberHasProject, WorkspaceMember } from "../models/Workspace.js";

export const createTeam = async (req, res, next) => {
    try {
        const userKey = req.body.users.map((user) => user.user_key);

        const team = await Team.create({
            team_key: "T-" + crypto.randomBytes(2).toString("hex"),
            team_name: req.body.team_name,
            work_key: req.body.work_key,
        })

        const memberUpdate = await WorkspaceMember.update(
            { team_key: team.team_key },
            { where: { user_key: userKey } }
        )

        res.status(201).json({
            success: true,
            message: "Create team success",
            // data: team,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const findAllTeam = async (req, res, next) => {
    try {
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

        // const teams = await Team.rightJoin(WorkspaceMember, {
        //     on: {
        //         team_key: {
        //             table: WorkspaceMember,
        //             column: 'team_key',
        //         },
        //     },
        //     include: [{
        //         model: User,
        //         attributes: ['username', 'photo']
        //     }]
        // })
        res.status(200).json({
            success: true,
            message: "Successed",
            data: teams,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const teamDetail = async (req, res, next) => {
    const { team_key } = req.query;
    try {
        const teams = await Team.findOne({
            where: { team_key: team_key }
        });

        res.status(200).json({
            success: true,
            message: "Successed",
            data: teams,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const addMemberTeam = async (req, res, next) => {
    const { role, username, team_key } = req.body;
    try {
        const user = await User.findOne({
            where: {
                username: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("username")),
                    Sequelize.fn("LOWER", username)
                ),
            },
        });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const team = await Team.findOne({
            where: { team_key: team_key },
            include: [{ model: Workspace }],
        });
        const members = await TeamMember.findOne({
            where: { user_key: user.user_key },
        });
        if (members) {
            return res.status(409).json({
                success: false,
                message: "User has been member team",
            });
        }
        if (user.org_key === team.workspace.org_key) {
            const member = await TeamMember.create({
                member_key: "M",
                role: role,
                user_key: user.user_key,
                team_key: team_key,
            });
            await member.update({ member_key: `M-${member.id}` });
            res.status(201).json({
                success: true,
                message: "Successed add member",
                data: {
                    member: {
                        user_key: member.user_key,
                        role: member.role,
                        team_key: member.team_key,
                    },
                },
            });
        } else {
            res.status(400).json({
                success: false,
                message: `${members.username} is not eligible to become a member of team ${team.team_name}`,
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

export const findMemberTeam = async (req, res, next) => {
    const team_key = req.params.team_key;
    try {
        const team = await Team.findOne({
            where: {
                team_key: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("team_key")),
                    Sequelize.fn("LOWER", team_key)
                ),
            },
            attributes: ["team_key"],
        });
        if (!team) {
            return res.status(400).json({
                success: false,
                message: "Team not found",
            });
        }
        const teamMember = await TeamMember.findAll({
            where: { team_key: team.team_key },
            attributes: ["team_key", "role"],
            include: [
                {
                    model: User,
                    attributes: ["username"],
                },
            ],
        });

        res.status(200).json({
            success: true,
            message: "Successed",
            data: teamMember,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getTeamMember = async (req, res, next) => {
    const team_key = req.query.team_key;
    try {
        const member = await WorkspaceMember.findAll({
            where: {
                team_key: team_key,
            },
            attributes: ["team_key"],
            include: [{
                model: User,
                attributes: ['username', 'photo', 'user_key']
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

export const editTeamName = async (req, res, next) => {
    const { team_key, team_name } = req.body;
    try {
        const changeName = await Team.update({ team_name: team_name }, { where: { team_key: team_key } })
        res.status(201).json({
            success: true,
            message: "success",
            // data: team,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const teamProject = async (req, res, next) => {
    const { team_key } = req.query;
    try {
        const getUser = await WorkspaceMember.findAll({
            where: { team_key: team_key },
            include: [{
                model: MemberHasProject
            }]
        })
        res.status(200).json({
            success: true,
            message: "Team has been add project",
            data: teamProject,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getTeamProject = async (req, res, next) => {
    const { team_key } = req.query;
    try {
        const getProjectKey = await WorkspaceMember.findAll({
            where: { team_key: team_key },
            attributes: ['member_key'],
            include: [{
                model: MemberHasProject,
                attributes: ['project_key'],
                include: [{
                    model: Project,
                    attributes: ['project_key', 'project_name']
                }]
            }]
        })
        const getKey = getProjectKey.map((project) => project.member_has_projects.map(data => data.project_key));
        const projectKeyList = getKey.flat();

        const projects = await Project.findAll({
            where: {
                project_key: {
                    [Op.in]: projectKeyList
                }
            },
            attributes: ['project_key', 'project_name']
        })

        res.status(200).json({
            success: true,
            message: "success",
            data: projects,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const deleteTeam = async (req, res, next) => {
    const { team_key } = req.params;
    try {
        const changeMember = await WorkspaceMember.update({ team_key: null }, { where: { team_key: team_key } });
        if (!changeMember) {
            return res.status(500).json({
                success: false,
                message: "edit workspace member fail",
                error: error.message,
            });
        }
        const deleteTeam = await Team.destroy({ where: { team_key: team_key } });

        res.status(201).json({
            success: true,
            message: "success",
            // data: team,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};