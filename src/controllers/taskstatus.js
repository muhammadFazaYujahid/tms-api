import { Op, Sequelize, where } from "sequelize";
import Project from "../models/Project.js";
import Sprint from "../models/Sprint.js";
import { key } from "../utils/generateKey.js";
import { Task, TaskCommentHistory, TaskHandler, TaskStatus } from "../models/Task.js";
import { User, UserHasNotif } from "../models/User.js";
import crypto from "crypto";

export const getStatus = async (req, res, next) => {
    try {
        const sprint = await TaskStatus.findAll({
            where: {
                project_key: req.query.project_key,
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


export const getProceedTask = async (req, res, next) => {
    const { project_key, status_key } = req.query;
    try {
        const getSprint = await Sprint.findAll({ where: { project_key: project_key, status: 'process' }, attributes: ['sprint_key'] });

        const tasks = await Task.findAll({
            where: {
                sprint_key: {
                    [Op.in]: getSprint.map((sprint) => sprint.sprint_key),
                },
                status_key: status_key
            },
            include: [{
                model: TaskHandler,
                attributes: ['type', 'handler'],
                order: ['level', 'DESC']
            }]
        });


        if (tasks.length !== 0) {
            await Promise.all(
                tasks.map(async (task) => {
                    await Promise.all(
                        task.task_handlers.map(async (handler) => {
                            const user = await User.findOne({ where: { user_key: handler.handler }, attributes: ['username'] })
                            handler.setDataValue('handler_name', user.username)
                        })
                    )
                })
            )

        }


        res.status(200).json({
            success: true,
            message: "Successed",
            data: tasks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const createStatus = async (req, res, next) => {
    const { project_key, status_name } = req.body
    try {
        const getStatusLength = await TaskStatus.findAll({ where: { project_key: project_key } });
        const sort_index = getStatusLength.length + 1;
        const status_key = crypto.randomBytes(2).toString("hex") + '-' + project_key;
        const sprint = await TaskStatus.create({
            status_key: status_key,
            name: status_name,
            project_key: project_key,
            sort_index: sort_index,
        });
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

export const changeTaskStatusById = async (req, res, next) => {
    const { status_id, task_id, url } = req.body;
    try {
        // const created = new Date();
        const getTask = await Task.findOne({ where: { id: task_id } });
        if (getTask) {
            const old_status = await TaskStatus.findOne({ where: { status_key: getTask.status_key } });
            const new_status = await TaskStatus.findOne({ where: { id: status_id } });
            const getHandler = await TaskHandler.findAll({ where: { task_key: getTask.task_key, type: 'reporter' } });


            const getUser = await User.findOne({ where: { id: req.userId } });

            const createHistory = await TaskCommentHistory.create({
                user_key: getUser.user_key,
                action: 'Has Change Status',
                task_key: getTask.task_key,
                old_value: old_status.name,
                new_value: new_status.name,
                type: 'history',
                readed: false,
                url: url,
            })
            // let handler = [];

            await Promise.all(
                getHandler.map(async (data) => {
                    await UserHasNotif.create({
                        sender_key: getUser.user_key,
                        target_key: data.handler,
                        notif_id: createHistory.id,
                        type: 'task',
                        readed: false
                    })
                })
            )

            const tasks = await Task.update({ status_key: new_status.status_key }, { where: { task_key: getTask.task_key } });

        }
        res.status(200).json({
            success: true,
            message: "Successed",
        });

        // broadcastToUser('Someone has edit task status');

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const changeStatusName = async (req, res, next) => {
    const { status_key, status_name } = req.body
    try {
        const status = await TaskStatus.update({
            name: status_name,
        }, { where: { status_key: status_key } });
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

export const deleteStatus = async (req, res, next) => {
    const { status_key, destination_status } = req.body
    try {
        const changeStatus = await Task.update({ status_key: destination_status.status_key }, { where: { status_key: status_key } });
        if (!changeStatus) {
            return res.status(500).json({
                success: false,
                message: "Fail Change Task Status",
                error: error.message,
            });
        }
        const deleteStatus = await TaskStatus.destroy({ where: { status_key: status_key } })
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