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


//routes declaration
app.use("/api/v1/users", userRouter)


















import videoRoute from './routes/video.routes.js'
import tweetRoute from './routes/tweet.routes.js'
import likeRoute from './routes/like.routes.js'

app.use("/api/v1/videos", videoRoute)
app.use("/api/v1/tweets", tweetRoute)
app.use("/api/v1/likes", likeRoute)
app.use("/api/v1/comments", commentRoutes)
app.use("/api/v1/videos", videoRoute)
app.use("/api/v1/videos", videoRoute)
app.use("/api/v1/videos", videoRoute)
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