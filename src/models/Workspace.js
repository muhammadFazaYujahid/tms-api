import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

const Workspace = db.define(
    "workspaces",
    {
        work_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        workspace_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        org_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    { freezeTableName: true }
);

const WorkspaceMember = db.define(
    "workspace_member",
    {
        member_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        role: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        team_key: {
            type: DataTypes.STRING(10),
        },
        work_key: {
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
    {
        freezeTableName: true,
    }
);

const MemberHasProject = db.define(
    "member_has_project",
    {
        member_key: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        project_key: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
    },
    {
        freezeTableName: true,
    }
);

export { Workspace, WorkspaceMember, MemberHasProject };
