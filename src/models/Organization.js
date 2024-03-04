import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

const Organization = db.define(
    "organizations",
    {
        org_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        organization_name: {
            type: DataTypes.STRING(100),
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
const Activity = db.define(
    "activity",
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
        related_code: {
            type: DataTypes.STRING(30),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        object_one: {
            type: DataTypes.STRING(255),
        },
        object_two: {
            type: DataTypes.STRING(255),
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        additional_text: {
            type: DataTypes.TEXT,
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

export { Organization, Activity };
