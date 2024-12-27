import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from './routes/user.routes.js'
import videoRoute from './routes/video.routes.js'


//routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRoute)














// app.use("/api/v1/users", (req, res) => {
//     res.send("i am shivendra kumar")
// })
console.log("hii");

app.use("/tests", (req, res) => {
    res.send("i am shivendra kumar")

})

app.get('/test', (req, res) => {
    res.send('Test route working!');
});

//http://localhost:8000/api/v1/users/register

export { app }