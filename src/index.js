import dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";
dotenv.config()
connectDB()
    .then(() => {
        app.on('error', (err) => {
            console.log("error in starting server !!  ", err)
        })
        app.listen(process.env.PORT, () => {
            console.log(`server is running on port ${process.env.PORT}`)
        })
    })
    .catch((err)=>{
        console.log("error in connecting to database",err)
    })