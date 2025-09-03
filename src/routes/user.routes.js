import {Router} from "express"; 
import {registerUser} from "../controllers/user.controller.js"
import upload from "../middlewares/multer.middleware.js"
import {loginuser} from "../controllers/user.controller.js"
// import {ApiError} from "../utils/ApiError.js"



 const router = Router()
 router.route("/register").post(upload.fields([{
    name: "avatar", 
    maxCount: 1

 }, {
    name: "coverImage", 
    maxCount: 1

 }]), registerUser)
 router.route("/login").post(loginuser)




 export default router