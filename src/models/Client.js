import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

const Client = db.define(
    "clients",
    {
        client_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        name: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        description: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        org_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
    },
    { freezeTableName: true }
);
export default Client;
