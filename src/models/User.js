import { Sequelize } from "sequelize";
import db from "../configs/connection.js";
import { Organization } from "./Organization.js";

const { DataTypes } = Sequelize;

const User = db.define(
    "users",
    {
        user_key: {
            type: DataTypes.STRING(10),
            unique: true,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: true,
                len: [3, 100],
            },
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        photo: {
            type: DataTypes.STRING,
        },
        verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            allowNull: false,
            validate: {
                notEmpty: false,
            },
        },
        email_token: {
            type: DataTypes.STRING,
        },
        reset_password_token: {
            type: DataTypes.STRING,
        },
        org_key: {
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

const UserHasOrg = db.define(
    "user_has_org",
    {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        user_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
            references: {
                model: User,
                key: 'user_key'
            }
        },
        org_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM,
            values: ["superadmin", "admin", "user"],
            defaultValue: "admin",
            allowNull: false,
            validate: {
                isIn: {
                    args: [["superadmin", "admin", "user"]],
                    msg: "must be superadmin, admin, or user",
                },
            },
        },
    },
    {
        freezeTableName: true,
    }
);

const UserHasNotif = db.define(
    "user_has_notif",
    {
        id: {
            type: DataTypes.INTEGER(11),
            primaryKey: true,
            autoIncrement: true
        },
        sender_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        target_key: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        notif_id: {
            type: DataTypes.INTEGER(11),
            allowNull: false,
        },
        type: {
            type: DataTypes.STRING(50),
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        readed: {
            type: DataTypes.BOOLEAN(),
            allowNull: false,
        },
    },
    {
        freezeTableName: true,
    }
);


export { User, UserHasOrg, UserHasNotif };
