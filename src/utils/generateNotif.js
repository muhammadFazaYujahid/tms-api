import { Op } from "sequelize";
import { UserHasNotif } from "../models/User.js";
import { TaskHandler, TaskWatcher } from "../models/Task.js";

export const createNotification = async (req, res, next) => {
    const { sender_key, history_id, activity } = req.body;
    try {

        let type = activity.type;
        if (activity.type == 'history' || activity.type == 'comment') {
            type = 'task';
        }

        let target_user = [];

        if (type == 'task') {
            const target_handler = await TaskHandler.findAll({
                where: { task_key: activity.task_key, type: 'reporter' },
                attributes: [['handler', 'target_key']]
            });
            const handler_key = target_handler.map(handler => handler.dataValues.target_key);

            const target_watcher = await TaskWatcher.findAll({
                where: { task_key: activity.task_key, watcher_key: { [Op.notIn]: handler_key } },
                attributes: [['watcher_key', 'target_key']]
            });
            await Promise.all(
                target_handler.map((handler) => {
                    target_user.push({ target_key: handler.dataValues.target_key })
                }),
                target_watcher.map((watcher) => {
                    target_user.push({ target_key: watcher.dataValues.target_key })
                })
            )
        }

        await Promise.all(
            target_user.map(async (target) => {
                await UserHasNotif.create({
                    sender_key: sender_key,
                    target_key: target.target_key,
                    notif_id: history_id,
                    type: type,
                    readed: false
                })
            })
        ).then(() => next())

        // else if (type == 'project') {
        //     target_user = await MemberHasProject.findAll({ where: { project_key: activity.related_code }, attributes: ['member_key'] })
        // } {
        // }
        // if (task_key == 'none') {
        //     next();
        // } else {
        //     const user = await User.findOne({
        //         where: { id: req.userId },
        //         attributes: ['user_key']
        //     });

        //     const createHistory = await TaskCommentHistory.create({
        //         user_key: user.user_key,
        //         action: action,
        //         old_value: old_value,
        //         new_value: new_value,
        //         task_key: task_key,
        //         type: type,
        //         url: url,
        //         readed: false,
        //         additional_text: additional_text,
        //     });
        //     if (createHistory) {
        //         next();
        //     }

        // }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message,
        });
    }
};
