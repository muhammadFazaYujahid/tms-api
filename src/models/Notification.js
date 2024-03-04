import { Sequelize } from "sequelize";
import db from "../configs/connection.js";

const { DataTypes } = Sequelize;

// const Notification = db.define(
//     "notifications",
//     {
//         values: {
//             type: DataTypes.STRING,
//             allowNull: false,
//             validate: {
//                 notEmpty: true,
//             },
//         },
//         for_user_id: {
//             type: DataTypes.INTEGER,
//             allowNull: false,
//             validate: {
//                 notEmpty: true,
//             },
//         },
//     },
//     { freezeTableName: true }
// );

// export default Notification;
