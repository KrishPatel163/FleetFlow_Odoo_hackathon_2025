import 'dotenv/config';
import { connectDB } from "./src/db/index.js";
import app from "./src/app.js";

const PORT = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`⚙️  Server is running at port : ${PORT}`);
        });
    })
    .catch((err) => {
        console.log("PostgreSQL connection failed !!! ", err);
    });