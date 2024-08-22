import { Sequelize } from "sequelize";

const db = new Sequelize("project-manager", "postgres", "123", {
    host: "127.0.0.1",
    dialect: "postgres",
});

// const db = new Sequelize("project-manager", "root", "", {
//     host: "127.0.0.1",
//     dialect: "mariadb"
// })

export default db;
