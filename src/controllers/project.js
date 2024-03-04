import db from "../configs/connection.js";
import { Project, Sprint, TaskStatus, Team, TeamHasProject, User, Workspace } from "../models/index.js";
import { key } from "../utils/generateKey.js";
import { MemberHasProject, WorkspaceMember } from "../models/Workspace.js";
import { HasMany, Sequelize, Op } from "sequelize";
import path from "path";

export const createProject = async (req, res, next) => {
    const { project_name, workspace, selectedMember, client_key } = req.body;
    try {
        const words = project_name.split(' ');
        const initials = words.map((word) => word[0])
        const project_code = 'PJ-' + initials.join("").toUpperCase();
        // const checkProject = await Project.findOne({
        //     where: {
        //         project_name: Sequelize.where(
        //             Sequelize.fn("LOWER", Sequelize.col("project_name")),
        //             Sequelize.fn("LOWER", project_name)
        //         ),
        //     },
        // });
        // if (checkProject) {
        //     return res.status(409).json({
        //         success: false,
        //         message: "Project already",
        //     });
        // }
        const project = await Project.create({
            project_key: `P`,
            project_name: project_name,
            work_key: workspace.work_key,
            client_key: client_key,
            level: 'medium',
            // client_key: '-'
        });
        const updateProject = await project.update({
            project_key: `PJ-${key(project_name)}-${project.id}`,
        });
        if (updateProject) {

            const sprint = await Sprint.create({
                sprint_key: `P-`,
                sprint_name: 'Backlog',
                project_key: updateProject.project_key,
                status: 'backlog',
                sort_index: 9999
            });
            await sprint.update({
                sprint_key: `BL-${key(project.project_name)}-${sprint.id}`,
            });

            const task_status = [
                {
                    status_key: `TD-${updateProject.project_key}`,
                    name: 'To Do',
                    description: 'To Do Tasks',
                    project_key: updateProject.project_key,
                    sort_index: 1
                },
                {
                    status_key: `OP-${updateProject.project_key}`,
                    name: 'On Progress',
                    description: 'In Progress Tasks',
                    project_key: updateProject.project_key,
                    sort_index: 2
                },
                {
                    status_key: `CP-${updateProject.project_key}`,
                    name: 'Completed',
                    description: 'Completed Tasks',
                    project_key: updateProject.project_key,
                    sort_index: 3
                },
            ]

            const createTaskStatus = await TaskStatus.bulkCreate(task_status);

            await Promise.all(
                selectedMember.map(async (member) => {
                    await MemberHasProject.create({
                        member_key: member.member_key,
                        project_key: updateProject.project_key
                    })
                })
            ).then(() => {
                res.status(201).json({
                    success: true,
                    message: "Successed created project",
                    data: updateProject.project_key,
                });
            })
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.errors,
        });
    }
};

export const projectList = async (req, res, next) => {
    const { org_key } = req.query;
    try {
        // get data dengan include gagal, error "operator does not exist: character varying = integer"
        // metode alternatif:

        //ambil data workspace berdasarkan org_key
        const getWorkspace = await Workspace.findAll({ where: { org_key: org_key }, attributes: ['work_key'] });
        //convert data work_key ke dalam array workspaceData
        const workspaceData = getWorkspace.map(workspace => workspace.work_key);
        //ambil data project yang work_keynya ada di dalam array workspaceData
        const getProjects = await Project.findAll({
            where: {
                work_key: {
                    [Op.in]: workspaceData
                }
            },
            attributes: ["work_key", "project_key", "project_name"],
        });
        let projects = [];

        //ambil data workspace_name lalu dimasukkan ke array projects
        Promise.all(
            getProjects.map(async (project) => {
                const workspace = await Workspace.findOne({ where: { work_key: project.work_key }, attributes: ['workspace_name'] });
                // project.setDataValue('workspace_name', workspace);
                projects.push({ work_key: project.work_key, project_key: project.project_key, project_name: project.project_name, workspace_name: workspace.workspace_name })
            })
        ).then(() => {
            res.status(200).json({
                success: true,
                message: "Successed",
                data: projects,
            });

        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const projectDetail = async (req, res, next) => {
    const { project_key } = req.query;
    try {
        const project = await Project.findOne({ where: { project_key: project_key } });
        res.status(200).json({
            success: true,
            message: "Successed",
            data: project,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const editProjectName = async (req, res, next) => {
    const { project_key, project_name } = req.body;
    try {
        const editName = await Project.update({ project_name: project_name }, { where: { project_key: project_key } })
        res.status(200).json({
            success: true,
            message: "Successed",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const deleteProject = async (req, res, next) => {
    const { project_key } = req.params;
    try {
        const delete_project = await Project.destroy({ where: { project_key: project_key } })
        res.status(200).json({
            success: true,
            message: "Successed",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const removeMember = async (req, res, next) => {
    const { project_key, user_key } = req.body;
    try {
        const member = await WorkspaceMember.findOne({ where: { user_key: user_key } });
        const delete_project = await MemberHasProject.destroy({ where: { member_key: member.member_key, project_key: project_key } })
        res.status(200).json({
            success: true,
            message: "Successed",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const getProjectHandler = async (req, res, next) => {
    const { project_key } = req.query
    try {
        const getWorkKey = await Project.findOne({ where: { project_key: project_key }, attributes: ['work_key'] });
        const getWorkspace = await Workspace.findOne({
            where: { work_key: getWorkKey.work_key },
            attributes: ['work_key', 'workspace_name'],
            include: [{
                model: WorkspaceMember,
                attributes: ['user_key']
            }]
        });

        const getInvitedMember = await MemberHasProject.findAll({ where: { project_key: project_key }, attributes: ['member_key'] })

        const getTeam = await Team.findAll({
            where: {
                work_key: getWorkKey.work_key
            },
            attributes: ["team_key", "team_name", "work_key"],
            include: [{
                model: WorkspaceMember,
                where: {
                    member_key: {
                        [Sequelize.Op.in]: getInvitedMember.map((user) => user.member_key),
                    }
                },
                // required: true,
                attributes: ['member_key', 'role', 'user_key'],
                include: [{
                    model: User,
                    attributes: ['username', 'photo']
                }]
            }]
        })
        const noTeamMember = await WorkspaceMember.findAll({
            attributes: ['member_key', 'role'],
            where: {
                work_key: getWorkKey.work_key,
                team_key: null,
                member_key: {
                    [Sequelize.Op.in]: getInvitedMember.map((user) => user.member_key),
                }
            },
            include: [{
                model: User,
                attributes: ['user_key', 'username']
            }]
        })
        const noTeam = { team_key: 'no_key', team_name: 'No Team', workspace_members: noTeamMember };
        let allMember = [];
        Promise.all(
            getTeam.map((member) => allMember.push({ team_key: member.team_key, team_name: member.team_name, work_key: getTeam.work_key, workspace_members: member.workspace_members })),

        )
        if (noTeamMember.length > 0) {
            allMember.push(noTeam)
        }
        res.status(200).json({
            success: true,
            message: "Successed get member",
            data: allMember,
            workspace: getWorkspace
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

export const changeProjectName = async (req, res, next) => {
    const { project_name } = req.body;
    const project_key = req.params.project_key;
    try {
        const checkProject = await Project.findOne({
            where: {
                project_name: Sequelize.where(
                    Sequelize.fn("LOWER", Sequelize.col("project_name")),
                    Sequelize.fn("LOWER", project_name)
                ),
            },
        });
        if (checkProject) {
            return res.status(409).json({
                success: false,
                message: "Project name already",
            });
        }
        const project = await Project.findOne({
            where: { project_key: project_key },
        });
        if (project) {
            project.project_name = project_name;
            await project.save((err) => {
                if (err) {
                    return res.status(500).json({ message: err });
                }
            });
        }
        res.status(200).json({
            success: false,
            message: "Successfully updated project name",
            data: project,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};



export const searchMemberProject = async (req, res) => {
    const { project_key } = req.query
    try {
        const getWorkKey = await Project.findOne({ where: { project_key: project_key }, attributes: ['work_key'] });
        const getWorkspace = await Workspace.findOne({
            where: { work_key: getWorkKey.work_key },
            attributes: ['work_key', 'workspace_name'],
            include: [{
                model: WorkspaceMember,
                attributes: ['member_key']
            }]
        });

        const getInvitedMember = await MemberHasProject.findAll({ where: { project_key: project_key }, attributes: ['member_key'] })

        const getTeam = await Team.findAll({
            where: {
                work_key: getWorkKey.work_key
            },
            attributes: ["team_key", "team_name", "work_key"],
            include: [{
                model: WorkspaceMember,
                where: {
                    member_key: {
                        [Sequelize.Op.notIn]: getInvitedMember.map((user) => user.member_key),
                    }
                },
                // required: true,
                attributes: ['member_key', 'role'],
                include: [{
                    model: User,
                    attributes: ['username', 'photo']
                }]
            }]
        })
        const noTeamMember = await WorkspaceMember.findAll({
            attributes: ['member_key', 'role'],
            where: {
                work_key: getWorkKey.work_key,
                team_key: null,
                member_key: {
                    [Sequelize.Op.notIn]: getInvitedMember.map((user) => user.member_key),
                }
            },
            include: [{
                model: User,
                attributes: ['user_key', 'username']
            }]
        })
        const noTeam = { team_key: 'no_key', team_name: 'No Team', workspace_members: noTeamMember };
        let allMember = [];
        Promise.all(
            getTeam.map((member) => allMember.push({ team_key: member.team_key, team_name: member.team_name, work_key: getTeam.work_key, workspace_members: member.workspace_members })),
            allMember.push(noTeam)

        );
        res.status(200).json({
            success: true,
            message: "Successed get member",
            data: allMember,
            workspace: getWorkspace
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const inviteMember = async (req, res, next) => {
    const { project_key, workspace, selectedMember } = req.body;
    try {
        await Promise.all(
            selectedMember.map(async (member) => {
                await MemberHasProject.create({
                    member_key: member.member_key,
                    project_key: project_key
                })
            })
        ).then(() => {
            res.status(201).json({
                success: true,
                message: "Successed Invite Member",
            });
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};


export const userPhotoName = async (req, res, next) => {
    const { project_key } = req.body;
    try {
        const getMemberKey = await MemberHasProject.findAll({ where: { project_key: project_key }, attributes: ['member_key'] });
        let memberData = [];
        Promise.all(
            getMemberKey.map(async (member) => {
                const userData = await WorkspaceMember.findOne({
                    where: { member_key: member.member_key },
                    attributes: ['user_key'],
                    include: [{
                        model: User,
                        attributes: ['username', 'photo']
                    }]
                })
                memberData.push({ user_key: userData.user_key, username: userData.user.username, photo: (userData.user.photo == null) ? 'default-photo.png' : userData.user.photo });
            })
        ).then(() => {

            // const photosList = memberData.map(user => user.photo);
            // const photos = (photosList.length > 4) ? photosList.slice(0, 4) : photosList;
            // const imagePaths = photos.map(photo => path.join(process.cwd(), 'public', 'avatars', photo));
            // for (const imagePath of imagePaths) {
            //     res.sendFile(imagePath);
            // }
            // res.json(imagePaths);
            res.status(200).json({
                success: true,
                message: "Successed get photo",
                data: memberData
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

export const user_photo = async (req, res, next) => {
    const { photo } = req.query;
    try {
        const imagePath = path.join(process.cwd(), 'public', 'avatars', photo);
        res.sendFile(imagePath);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
