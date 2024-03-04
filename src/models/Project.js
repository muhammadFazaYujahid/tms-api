import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

const Project = db.define(
    "projects",
    {
        work_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        project_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        project_name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        level: {
            type: DataTypes.ENUM,
            values: ["low", "medium", "high"],
            allowNull: false,
            validate: {
                isIn: {
                    args: [["low", "medium", "high"]],
                    msg: "must be low, medium, or high",
                },
            },
        },
        client_key: {
            type: DataTypes.STRING(10),
            allowNull: true,
            validate: {
                notEmpty: true,
            },
        },
    },
    {
        freezeTableName: true,
    }
);
export default Project;
