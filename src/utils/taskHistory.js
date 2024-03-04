import { Op, Sequelize } from "sequelize";
import Project from "../models/Project.js";
import Sprint from "../models/Sprint.js";
import { key } from "../utils/generateKey.js";
import { User } from "../models/User.js";
import { TaskCommentHistory } from "../models/Task.js";

export const createTaskHistory = async (req, res, next) => {
    const { action, old_value, new_value, type, task_key, url, additional_text } = req.body.activity;
    try {

        const user = await User.findOne({
            where: { id: req.userId },
            attributes: ['user_key']
        });

        req.body.sender_key = user.user_key;
        if (task_key == 'none') {
            const newActivity = {
                user_key: user.user_key,
                action: action,
                object_one: '',
                object_two: '',
                related_code: req.body.project_key,
                type: 'project',
                url: url,
                additional_text: '',
            }
            req.body.activity = newActivity;
            next();
        } else {

            const createHistory = await TaskCommentHistory.create({
                user_key: user.user_key,
                action: action,
                old_value: old_value,
                new_value: new_value,
                task_key: task_key,
                type: type,
                url: url,
                readed: false,
                additional_text: additional_text,
            });
            if (createHistory) {
                req.body.history_id = createHistory.id;
                req.body.sender_key = user.user_key;
                req.body.activity.related_code = 'none';
                next();
            }

        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
