import crypto from "crypto";
import multer from "multer";
import fs from "fs";
import {
    Sprint,
    Task,
    TaskAttachement,
    TaskCommentHistory,
    TaskHandler,
    TaskStatus,
    User,
} from "../models/index.js";
import { key } from "../utils/generateKey.js";
import { upload, multipleUpload } from "../middleware/Multer.js";
import { io, getSocket, broadcastToUser } from "../utils/socket.js";
import { UserHasNotif } from "../models/User.js";
import { TaskIssue, TaskWatcher, VotedTask } from "../models/Task.js";
import { Op, Sequelize, where } from "sequelize";
import path from "path";

const socket = getSocket();

export const createTask = async (req, res, next) => {
    const {
        sprint_key,
        task_name,
        level,
        assigne,
        reporter,
        project_key,
        fastest_time,
        normal_time,
        slowest_time,
        parent_key
    } = req.body;
    try {
        const user = [];
        user.push(assigne);
        user.push(reporter);
        const task = await Task.create({
            task_key: "TS-" + crypto.randomBytes(2).toString("hex"),
            task_name: task_name,
            level: level.level,
            status_key: 'TD-' + project_key,
            optimistic_time: fastest_time,
            mostlikely_time: normal_time,
            pessimistic_time: slowest_time,
            parent_key: parent_key,
            sprint_key: sprint_key
        });
        if (task) {

            await Promise.all(
                assigne.map(async (data) => {
                    // user.push({ type: 'assigne', data: data });
                    await TaskHandler.create({
                        task_key: task.task_key,
                        type: 'assigner',
                        handler: data.user_key

                    })
                }),
                reporter.map(async (data) => {
                    await TaskHandler.create({
                        task_key: task.task_key,
                        type: 'reporter',
                        handler: data.user_key

                    })
                    // user.push({ type: 'reporter', data: data });
                })
            ).then(() => {

                res.status(201).json({
                    success: true,
                    message: "New task created sucessfully",
                    data: task,
                    creator_name: req.creator_name
                });
            })
        }
        // await task.update({ task_key: `${key(task_name)}-${task.id}` });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const changeSprint = async (req, res, next) => {
    const {
        sprint_id,
        task_id
    } = req.body;
    try {
        const sprintData = await Sprint.findOne({
            where: {
                id: sprint_id
            }
        })
        const task = await Task.update({ sprint_key: sprintData.sprint_key }, { where: { id: task_id } });
        res.status(201).json({
            success: true,
            message: "New task updated sucessfully",
            data: task,
        });
        // await task.update({ task_key: `${key(task_name)}-${task.id}` });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const listTask = async (req, res, next) => {
    try {
        const tasks = await Task.findAll({
            where: { sprint_key: req.query.sprint_key },
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

export const getTaskDetail = async (req, res, next) => {
    const { task_key } = req.query;
    try {
        const task = await Task.findOne({
            where: { task_key: task_key },
            include: [{
                model: TaskHandler,
                attributes: ['type', 'handler'],
                order: ['level', 'DESC']
            }]
        });

        await Promise.all(
            task.task_handlers.map(async (handler) => {
                const user = await User.findOne({ where: { user_key: handler.handler }, attributes: ['username'] })
                handler.setDataValue('handler_name', user.username)
            })
        )
        // await Promise.all(
        //     tasks.map(async (task) => {
        //     })
        // )

        res.status(200).json({
            success: true,
            message: "Successed",
            data: task,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const changeTaskStatus = async (req, res, next) => {
    const { status_key, task_key, task_name, url } = req.body;
    try {
        const created = new Date();
        const getTask = await Task.findOne({ where: { task_key: task_key } });
        if (getTask) {
            const old_status = await TaskStatus.findOne({ where: { status_key: getTask.status_key } });
            const new_status = await TaskStatus.findOne({ where: { status_key: status_key } });
            const getHandler = await TaskHandler.findAll({ where: { task_key: task_key, type: 'reporter' } });


            const getUser = await User.findOne({ where: { id: req.userId } });
            const createHistory = await TaskCommentHistory.create({
                user_key: getUser.user_key,
                action: `Has Change ${task_name} Task Status`,
                task_key: task_key,
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

            const tasks = await Task.update({ status_key: status_key }, { where: { task_key: task_key } });

            res.status(200).json({
                success: true,
                message: "Successed",
                data: { user: getUser.username, old_status: old_status.name, new_status: new_status.name, url: createHistory.url }
            });
        }

        // broadcastToUser('Someone has edit task status');

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const getTaskByName = async (req, res, next) => {
    const { project_key, task_name, task_key } = req.body;
    try {
        const getSprint = await Sprint.findAll({ where: { project_key: project_key, status: 'process' }, attributes: ['sprint_key'] });

        const tasks = await Task.findAll({
            where: {
                task_key: {
                    [Op.not]: task_key,
                },
                sprint_key: {
                    [Op.in]: getSprint.map((sprint) => sprint.sprint_key),
                },
                task_name: {
                    [Op.like]: `%${task_name}%`
                }
            },
            attributes: ['task_key', 'task_name']
        });
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


export const detailTask = async (req, res, next) => {
    const task_key = req.params.task_key;
    try {
        const tasks = await Task.findOne({
            where: { task_key: task_key },
            include: [
                {
                    model: User,
                    as: "reporter_task",
                    attributes: ["username"],
                },
                {
                    model: User,
                    as: "assignee_task",
                    attributes: ["username"],
                },
                {
                    model: TaskCommentHistory,
                    as: "commnet_task",
                    attributes: ["type", "action"],
                    include: [
                        {
                            model: User,
                            attributes: ["username"],
                        },
                    ],
                },
            ],
        });
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


export const changeDescTask = async (req, res, next) => {
    const { description, task_key } = req.body;
    try {
        const task = await Task.findOne({
            where: {
                task_key: task_key,
            },
        });
        if (!task) {
            return res.status(404).json({
                success: false,
                message: "Task Not Found",
            });
        }
        await task.update({
            task_description: description,
        });
        res.status(201).json({
            success: true,
            message: "Task Updated",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const taskAttachment = (req, res, next) => {
    multipleUpload("attachments", 5)(req, res, async (err) => {
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
        const files = req.files;
        let paths = [];
        let names = [];
        if (files !== undefined) {
            paths = files.map((file) => file.path);
            names = files.map((file) => file.originalname);
        }
        const { task_key, action, old_value, new_value, type, activity_task_key, url, additional_text } = req.body;
        try {
            const user = await User.findOne({
                where: { id: req.userId },
            });
            const task = await Task.findOne({
                where: {
                    task_key: Sequelize.where(
                        Sequelize.fn("LOWER", Sequelize.col("task_key")),
                        Sequelize.fn("LOWER", task_key)
                    ),
                },
            });

            const createHistory = await TaskCommentHistory.create({
                user_key: user.user_key,
                action: action,
                old_value: old_value,
                new_value: new_value,
                task_key: activity_task_key,
                type: type,
                url: url,
                readed: false,
                additional_text: additional_text,
            });
            if (!task) {
                if (paths.length > 0) {
                    paths.forEach((path) => fs.unlinkSync(path));
                }
                return res.status(404).json({
                    success: false,
                    message: "Task not found",
                });
            }
            const attachments = [];
            for (let i = 0; i < files.length; i++) {
                const attach = await TaskAttachement.create({
                    attach_name: names[i],
                    task_key: task.task_key,
                    upload_by: user.user_key,
                    attach_file: paths[i],
                });
                attachments.push(attach);
            }
            res.status(200).json({
                success: true,
                message: "Upload attachments successfully",
                data: attachments,
            });
        } catch (error) {
            if (paths.length > 0) {
                paths.forEach((path) => fs.unlinkSync(path));
            }
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
                error: error.message,
            });
        }
    });
};


export const attachmentByTask = async (req, res, next) => {
    const { task_key } = req.query;
    try {
        const attachment = await TaskAttachement.findAll({
            where: { task_key: task_key }
        });
        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }
        res.status(200).json({
            success: true,
            message: "Get Attachment Success",
            data: attachment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const getAttachFile = async (req, res, next) => {
    const { attach_id } = req.query;
    try {
        const attachment = await TaskAttachement.findOne({ where: { id: attach_id }, attributes: ['attach_file'] })
        const imagePath = path.join(process.cwd(), attachment.attach_file);

        res.sendFile(imagePath);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const changeNameAttachment = async (req, res, next) => {
    const { attach_name, attachId } = req.body;
    try {
        const attachment = await TaskAttachement.findOne({
            where: { id: attachId },
        });
        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Attachment not found",
            });
        }
        await attachment.update({ attach_name: attach_name });
        res.status(200).json({
            success: true,
            message: "Attach name changed successfully",
            data: attachment.attach_name,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};


export const deletedAttachment = async (req, res, next) => {
    const { attachId } = req.params;
    try {
        const attachment = await TaskAttachement.findOne({ where: { id: attachId } });
        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }
        const filePath = attachment.attach_file;
        fs.unlinkSync(filePath);
        await attachment.destroy();
        res.status(200).json({
            success: true,
            message: "Attachment deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const removeChild = async (req, res, next) => {
    const { child_key } = req.body;
    try {
        const task = await Task.update({ parent_key: '' }, { where: { task_key: child_key } })
        res.status(200).json({
            success: true,
            message: "Attachment deleted successfully",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getTaskIssue = async (req, res, next) => {
    const { task_key } = req.query;
    try {
        const taskIssue = await TaskIssue.findAll({
            where: { task_key: task_key },
            attributes: ['id', 'task_key', 'type', 'issue', 'issued_task', 'url', 'link_text']
        });
        let issues = [];
        Promise.all(
            taskIssue.filter(issue => issue.type == 'link_issue').map(async (issue) => {
                const task = await Task.findOne({
                    where: {
                        task_key: issue.issued_task
                    },
                    include: [{
                        model: TaskHandler,
                        attributes: ['type', 'handler'],
                    }]
                })

                await Promise.all(
                    task.task_handlers.map(async (handler) => {
                        const user = await User.findOne({ where: { user_key: handler.handler }, attributes: ['username'] })
                        handler.setDataValue('handler_name', user.username)
                    })
                )
                issues.push({ ...issue.dataValues, taskDetail: task });
            })
        ).then(() => {
            res.status(200).json({
                success: true,
                message: "Successed",
                data: issues,
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

export const createIssue = async (req, res, next) => {
    const { issue, issued_task, task_key, type, link_text, web_link } = req.body;
    try {
        const issueType = type.toLowerCase().replace(" ", "_");

        const addIssue = await TaskIssue.create({
            task_key: task_key,
            type: issueType,
            issue: issue,
            issued_task: issued_task,
            url: web_link,
            link_text: link_text
        })

        res.status(200).json({
            success: true,
            message: "Issue Added",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const deleteIssue = async (req, res, next) => {
    const { issueId } = req.body;
    try {
        const removeIssue = await TaskIssue.destroy({ where: { id: issueId } });
        // if (removeIssue) {
        // }
        res.status(200).json({
            success: true,
            message: "Issue deleted",
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const commentTask = async (req, res, next) => {
    const { task_key, comment, url } = req.body;
    try {
        const user = await User.findOne({
            where: { id: req.userId },
        });
        const task = await Task.findOne({
            where: { task_key: task_key },
        });
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        const addcomment = await TaskCommentHistory.create({
            user_key: user.user_key,
            action: 'Comment',
            task_key: task_key,
            type: 'comment',
            url: url,
            readed: false,
            additional_text: comment,
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

export const getCommentHistory = async (req, res, next) => {
    const { task_key } = req.query;
    try {
        const taskHistory = await TaskCommentHistory.findAll({
            where: { task_key: task_key },
            order: [['createdAt', 'DESC']],
            include: [
                {
                    model: User,
                    attributes: ['username', 'email']
                }
            ]
        });
        res.status(200).json({
            success: true,
            message: "Successed",
            data: taskHistory
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

export const getChildTask = async (req, res, next) => {
    const { task_key } = req.query;
    try {
        const tasks = await Task.findAll({
            where: { parent_key: task_key },
            include: [{
                model: TaskHandler,
                attributes: ['type', 'handler'],
            }]
        });

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
//Task Status Section

//Task Status Section
export const getTaskStatus = async (req, res, next) => {
    try {
        const tasks = await TaskStatus.findAll({
            where: { project_key: req.query.project_key },
            attributes: ['status_key', 'name', 'description', 'project_key']
        });
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


export const editTaskDetail = async (req, res, next) => {
    const {
        task_key,
        task_name,
        level,
        assigne,
        reporter,
        fastest_time,
        normal_time,
        slowest_time,
    } = req.body;
    try {

        const task = await Task.update({
            task_name: task_name,
            level: level.level,
            optimistic_time: fastest_time,
            mostlikely_time: normal_time,
            pessimistic_time: slowest_time,
        }, {
            where: {
                task_key: task_key
            }
        });
        if (task) {
            const deleteHandler = await TaskHandler.destroy({ where: { task_key: task_key } })
            if (deleteHandler) {
                await Promise.all(
                    assigne.map(async (data) => {
                        // user.push({ type: 'assigne', data: data });
                        await TaskHandler.create({
                            task_key: task_key,
                            type: 'assigner',
                            handler: data.user_key

                        })
                    }),
                    reporter.map(async (data) => {
                        await TaskHandler.create({
                            task_key: task_key,
                            type: 'reporter',
                            handler: data.user_key

                        })
                        // user.push({ type: 'reporter', data: data });
                    })
                ).then(() => {

                    res.status(201).json({
                        success: true,
                        message: "task updated sucessfully",
                    });
                })

            }

        }
        // await task.update({ task_key: `${key(task_name)}-${task.id}` });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};

// Watcher Section Start
export const addWatch = async (req, res, next) => {
    const { task_key } = req.body;
    try {
        const user = await User.findOne({ where: { id: req.userId } })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const watcher = await TaskWatcher.create({
            task_key: task_key,
            watcher_key: user.user_key,
        });
        res.status(200).json({
            success: true,
            message: "Watcher added successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const removeWatch = async (req, res, next) => {
    const { task_key } = req.body;
    try {
        const user = await User.findOne({ where: { id: req.userId } })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const watcher = await TaskWatcher.destroy({
            where: {
                task_key: task_key,
                watcher_key: user.user_key,
            }
        });
        res.status(200).json({
            success: true,
            message: "Watcher removed successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}


export const getWatcher = async (req, res, next) => {
    const { task_key } = req.query;
    try {
        const watcher = await TaskWatcher.findAll({
            where: { task_key: task_key },
        })
        await Promise.all(
            watcher.map(async (data) => {
                const user = await User.findOne({ where: { user_key: data.watcher_key }, attributes: ['username', 'email'] })
                data.setDataValue('username', user.username)
                data.setDataValue('email', user.email)
            })
        )

        res.status(200).json({
            success: true,
            message: "Successed",
            data: watcher,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
// Watcher Section End

// Vote Section Start
export const voteTask = async (req, res, next) => {
    const { task_key } = req.body;
    try {
        const user = await User.findOne({ where: { id: req.userId } })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const vote = await VotedTask.create({
            task_key: task_key,
            user_key: user.user_key,
        });
        res.status(200).json({
            success: true,
            message: "Task Voted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const unvoteTask = async (req, res, next) => {
    const { task_key } = req.body;
    try {
        const user = await User.findOne({ where: { id: req.userId } })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }
        const vote = await VotedTask.destroy({
            where: {
                task_key: task_key,
                user_key: user.user_key,
            }
        });
        res.status(200).json({
            success: true,
            message: "Task Unvote success.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}


export const getTaskVote = async (req, res, next) => {
    const { task_key } = req.query;
    try {
        const vote = await VotedTask.findAll({
            where: { task_key: task_key },
        })
        await Promise.all(
            vote.map(async (data) => {
                const user = await User.findOne({ where: { user_key: data.user_key }, attributes: ['username', 'email'] })
                data.setDataValue('username', user.username)
                data.setDataValue('email', user.email)
            })
        )

        res.status(200).json({
            success: true,
            message: "Successed",
            data: vote,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
// Vote Section End


// Share Section Start
export const shareTask = async (req, res, next) => {
    const { selected_user, activity } = req.body;
    try {
        const getUser = await User.findOne({ where: { id: req.userId }, attributes: ['user_key'] });
        const createHistory = await TaskCommentHistory.create({
            action: activity.action,
            user_key: getUser.user_key,
            task_key: activity.task_key,
            old_value: activity.old_value,
            type: activity.type,
            url: activity.url,
            readed: false,
            additional_text: activity.additional_text

        })
        if (!createHistory) {
            return res.status(500).json({
                success: false,
                message: "Create History Fail",
                error: error.message,
            });
        }

        const createNotif = await UserHasNotif.create({
            sender_key: getUser.user_key,
            target_key: selected_user,
            notif_id: createHistory.id,
            type: 'task',
            readed: false
        })

        res.status(200).json({
            success: true,
            message: "Share Task Success",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}
// Share Section Start

// Flag Section Start
export const flagTask = async (req, res, next) => {
    const { task_key } = req.body;
    try {
        const task = await Task.update({ flag: true }, { where: { task_key: task_key } })
        res.status(200).json({
            success: true,
            message: "Task Voted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

export const unflagTask = async (req, res, next) => {
    const { task_key } = req.body;
    try {
        const task = await Task.update({ flag: false }, { where: { task_key: task_key } })
        res.status(200).json({
            success: true,
            message: "Task Unvote success.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

// Flag Section End

// Flag Section End
export const editParent = async (req, res, next) => {
    const { task_key, parent_key } = req.body;
    try {
        const task = await Task.update({ parent_key: parent_key }, { where: { task_key: task_key } })
        res.status(200).json({
            success: true,
            message: "Task Unvote success.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

// Flag Section End

// Flag Section End
export const deleteTask = async (req, res, next) => {
    const { taskKey } = req.params;
    try {
        const removeParent = await Task.update({ parent_key: '' }, { where: { parent_key: taskKey } });
        if (removeParent) {
            const removeTask = await Task.destroy({ where: { task_key: taskKey } });
        }
        // const task = await Task.update({ parent_key: parent_key }, { where: { task_key: task_key } })
        res.status(200).json({
            success: true,
            message: "Task Deleted",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

// Flag Section End

// Delete Comment Section End
export const deleteComment = async (req, res, next) => {
    const { commentId } = req.body;
    try {
        const delete_comment = await TaskCommentHistory.destroy({ where: { id: commentId } });
        res.status(200).json({
            success: true,
            message: "Comment Deleted",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
}

// Delete Comment Section End