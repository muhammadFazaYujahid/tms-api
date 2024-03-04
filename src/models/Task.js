import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

const Task = db.define(
    "tasks",
    {
        task_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        task_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        task_description: {
            type: DataTypes.TEXT,
        },
        level: {
            type: DataTypes.INTEGER(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        optimistic_time: {
            type: DataTypes.FLOAT(4),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        mostlikely_time: {
            type: DataTypes.FLOAT(4),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        pessimistic_time: {
            type: DataTypes.FLOAT(4),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        status_key: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: "backlog",
            validate: {
                notEmpty: true,
            },
        },
        parent_key: {
            type: DataTypes.STRING(10),
            defaultValue: "null",
        },
        sprint_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        flag: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: "false",
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

const TaskHandler = db.define(
    "task_handler",
    {
        task_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        type: {
            type: DataTypes.ENUM,
            values: ["assigner", "reporter"],
            allowNull: false,
            validate: {
                isIn: {
                    args: [["assigner", "reporter"]],
                    msg: "must be assigner, or reporter",
                },
            },
        },
        handler: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

const TaskWatcher = db.define(
    "task_watcher",
    {
        task_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        watcher_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

const TaskStatus = db.define(
    "task_status",
    {
        status_key: {
            type: DataTypes.STRING(30),
            unique: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        project_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        description: {
            type: DataTypes.STRING(255),
        },
        sort_index: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

const TaskIssue = db.define(
    "task_issues",
    {
        task_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        type: {
            type: DataTypes.ENUM,
            values: ["link_issue", "web_link"],
        },
        issue: {
            type: DataTypes.ENUM,
            values: ["is blocked by", "blocks", "is clone by", "clones", "is duplicated by", "duplicates", "relates to"],
        },
        issued_task: {
            type: DataTypes.STRING(10),
        },
        url: {
            type: DataTypes.TEXT,
        },
        link_text: {
            type: DataTypes.TEXT,
        },
    },
    { freezeTableName: true }
);

const TaskActivities = db.define(
    "task_activities",
    {
        task_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        activity: {
            type: DataTypes.STRING,
        },
        user_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

const VotedTask = db.define(
    "voted_tasks",
    {
        task_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        user_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

const TaskAttachement = db.define(
    "task_attachment",
    {
        attach_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        attach_file: {
            type: DataTypes.STRING,
        },
        upload_by: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        task_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);
const TaskCommentHistory = db.define(
    "task_comment_history",
    {
        user_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        action: {
            type: DataTypes.TEXT,
            validate: {
                notEmpty: true,
            },
        },
        task_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        old_value: {
            type: DataTypes.STRING(255),
        },
        new_value: {
            type: DataTypes.STRING(255),
        },
        type: {
            type: DataTypes.ENUM,
            values: ["comment", "history"],
            allowNull: false,
            validate: {
                isIn: {
                    args: [["comment", "history"]],
                    msg: "must be comment, or history",
                },
            },
        },
        additional_text: {
            type: DataTypes.TEXT,
        },
        readed: {
            type: DataTypes.BOOLEAN(),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        url: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

export {
    Task,
    TaskHandler,
    TaskWatcher,
    TaskStatus,
    TaskIssue,
    TaskActivities,
    TaskAttachement,
    TaskCommentHistory,
    VotedTask,
};
