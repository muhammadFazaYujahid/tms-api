import { User } from "../models/User.js";
import { Activity } from "../models/Organization.js";

export const createActivity = async (req, res, next) => {
    const { action, object_one, object_two, type, related_code, url, additional_text } = req.body.activity;
    try {
        if (related_code == 'none') {
            next();
        } else {
            const user = await User.findOne({
                where: { id: req.userId },
                attributes: ['user_key']
            });

            const createHistory = await Activity.create({
                user_key: user.user_key,
                action: action,
                object_one: object_one,
                object_two: object_two,
                related_code: related_code,
                type: type,
                url: url,
                additional_text: additional_text,
            });
            if (createHistory) {
                req.creator_name = user.username;
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
