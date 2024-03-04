import { Op, Sequelize } from "sequelize";
import Project from "../models/Project.js";
import Sprint from "../models/Sprint.js";
import { key } from "../utils/generateKey.js";
import { Task } from "../models/Task.js";

export const getSprint = async (req, res, next) => {
    try {
        const sprint = await Sprint.findAll({
            where: {
                project_key: req.query.project_key,
                sprint_key: {
                    [Op.notLike]: 'BL%'
                }
            },
            order: [['sort_index', 'ASC']],
        });
        if (!sprint) {
            return res.status(404).json({
                success: false,
                message: "Project doesn't exist",
            });
        }
        res.status(200).json({
            success: true,
            message: "Successed",
            data: sprint,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getBacklog = async (req, res, next) => {
    try {
        const sprint = await Sprint.findOne({
            where: {
                project_key: req.query.project_key,
                sprint_key: {
                    [Op.like]: 'BL%'
                }
            }
        });
        if (!sprint) {
            return res.status(404).json({
                success: false,
                message: "Project doesn't exist",
            });
        }
        res.status(200).json({
            success: true,
            message: "Successed",
            data: sprint,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const createSprint = async (req, res, next) => {
    // const {
    //     sprint_name,
    //     duration,
    //     start_date,
    //     end_date,
    //     sprint_goal,
    //     status,
    //     project_key,
    // } = req.body;
    const { project_key } = req.body;
    const project = await Project.findOne({
        where: {
            project_key: Sequelize.where(
                Sequelize.fn("LOWER", Sequelize.col("project_key")),
                Sequelize.fn("LOWER", project_key)
            ),
        },
    });
    if (!project) {
        return res.status(404).json({
            success: false,
            message: "Project not found",
        });
    }
    try {
        // const sprint = await Sprint.create({
        //     sprint_key: `P-`,
        //     sprint_name: sprint_name,
        //     duration: duration,
        //     start_date: start_date,
        //     end_date: end_date,
        //     sprint_goal: sprint_goal,
        //     status: status,
        //     project_key: project_key,
        // });
        const checkSprint = await Sprint.findAll({
            where: {
                project_key: project_key,
                sprint_key: {
                    [Op.notLike]: 'BL%'
                }
            }
        });
        const sprintLength = checkSprint.length + 1;
        const sprint = await Sprint.create({
            sprint_key: `P-`,
            sprint_name: 'temporary',
            project_key: project_key,
            sort_index: sprintLength
        });
        await sprint.update({
            sprint_key: `SP-${key(project.project_name)}-${sprint.id}`,
            sprint_name: `${key(project.project_name)} Sprint ${sprintLength}`
        });
        res.status(201).json({
            success: true,
            message: "Sprint created successfully",
            data: sprint,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const startSprint = async (req, res, next) => {
    const { sprint_key } = req.body;
    try {
        const sprint = await Sprint.update({
            status: 'process',
        }, {
            where: {
                sprint_key: sprint_key,
            }
        });
        res.status(200).json({
            success: true,
            message: "Sprint Started successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const editSprint = async (req, res, next) => {
    const {
        sprint_name,
        start_date,
        end_date,
        sprint_goal,
        sprint_key
    } = req.body;
    try {
        const sprint = await Sprint.update({
            sprint_name: sprint_name,
            start_date: start_date,
            end_date: end_date,
            sprint_goal: sprint_goal
        }, {
            where: {
                sprint_key: sprint_key,
            }
        });
        res.status(200).json({
            success: true,
            message: "Sprint Edited",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const completeSprint = async (req, res, next) => {
    const { completed_sprint, destination_sprint } = req.body
    try {
        const changeStatus = await Task.update({ sprint_key: destination_sprint }, {
            where: {
                sprint_key: completed_sprint,
                status_key: {
                    [Op.not]: 'CP-' + completed_sprint
                }
            }
        });
        if (!changeStatus) {
            return res.status(500).json({
                success: false,
                message: "Fail Change Task Sprint",
                error: error.message,
            });
        }
        const completeSprint = await Sprint.update({ status: 'completed' }, { where: { sprint_key: completed_sprint } })
        res.status(200).json({
            success: true,
            message: "Successed",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const deleteSprint = async (req, res, next) => {
    const { sprint_key, backlog_key } = req.body;
    try {
        const changeTaskSprint = await Task.update({ sprint_key: backlog_key }, { where: { sprint_key: sprint_key } });
        if (!changeTaskSprint) {
            return res.status(500).json({
                success: false,
                message: "Change Task Fail",
                error: error.message,
            });
        }
        const sprint = await Sprint.destroy({
            where: {
                sprint_key: sprint_key,
            }
        });
        res.status(200).json({
            success: true,
            message: "Sprint Deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
