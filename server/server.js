import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { functions, inngest } from './inngest/index.js';
import { serve } from "inngest/express";
import { clerkMiddleware } from '@clerk/express'
import userRouter from './routes/userRoute.js';
import postRouter from './routes/postRoute.js';
import storyRouter from './routes/storyRoute.js';
import messageRouter from './routes/messageRoute.js';
import callRouter from './routes/callRoutes.js';

const app=express();

await connectDB();

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

app.use(clerkMiddleware());

app.get('/',(req,res)=> res.send('Server is running'))
app.use('/api/inngest', serve({client: inngest, functions}))
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/story', storyRouter)
app.use('/api/message', messageRouter)
app.use('/api', callRouter)


const PORT= process.env.PORT || 4000;

app.listen(PORT,()=> console.log(`Server is running on port ${PORT}`))