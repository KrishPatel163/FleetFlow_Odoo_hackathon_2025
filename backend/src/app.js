import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Route imports
import authRouter from "./routes/auth.routes.js";
app.use("/api/v1/auth", authRouter);

export default app;