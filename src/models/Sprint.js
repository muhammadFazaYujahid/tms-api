import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

const Sprint = db.define(
    "sprints",
    {
        sprint_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        sprint_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        duration: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: {
                notEmpty: true,
            },
        },
        start_date: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                notEmpty: true,
            },
        },
        end_date: {
            type: DataTypes.DATE,
            allowNull: true,
            validate: {
                notEmpty: true,
            },
        },
        sprint_goal: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.STRING(100),
            defaultValue: "not_start",
            allowNull: false,
        },
        level: {
            type: DataTypes.ENUM,
            values: ["low", "medium", "high"],
            allowNull: false,
            defaultValue: "medium",
            validate: {
                isIn: {
                    args: [["low", "medium", "high"]],
                    msg: "must be low, medium, or high",
                },
            },
        },
        project_key: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
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

export default Sprint;
