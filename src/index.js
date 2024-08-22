import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import db from "./configs/connection.js";
import AuthRouter from "./routers/auth.js";
import UserRouter from "./routers/user.js";
import OrgRouter from "./routers/organization.js";
import session from "express-session";
import { setupSocketIO } from "./utils/socket.js";

dotenv.config();
const app = express();


const PORT = parseInt(process.env.PORT) || 8080;

//middleware
const corsOptions = {
    origin: ['http://localhost:3000']
}
app.use(cors({

    origin: true,
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
    secret: 'secret'
}))


// error handling
app.use((error, req, res, next) => {
    console.log(error.statusCode);
    const status = error.statusCode || 500;
    res.status(status).json({ message: error.message });
});

app.use("/api/auth", AuthRouter);
app.use("/api/user", UserRouter);
app.use("/api/organization", OrgRouter);


// uncomment at first running

// db.sync({ force: false })
//     .then(async () => {
//         console.log("Database Connection");
//     })
//     .catch((err) => console.log(err));

const server = app.listen(PORT, () => {
    console.log(`Server run on port ${PORT}`);
});

setupSocketIO(server);
