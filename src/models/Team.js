import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

const Team = db.define(
    "teams",
    {
        team_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        team_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        work_key: {
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
const TeamMember = db.define(
    "team_member",
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
const TeamHasProject = db.define(
    "team_has_project",
    {
        team_key: {
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

export { Team, TeamHasProject, TeamMember };
