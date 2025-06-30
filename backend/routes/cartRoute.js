import express from "express"; 
import mongoose from "mongoose" 
import authUser from "../middlewares/authUser.js";
import { updateCart } from "../controllers/cartController.js";

const cartRouter = express.Router(); 

cartRouter.post('/update', authUser, updateCart)

export default cartRouter;
