import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
const registerUser = asyncHandler( async(req, res) => { // high order function that accepts functions
    // get user details from frontend
    // validation - not empty 
    // check if user already exists: username, email
    // check for images , check for avatar
    // uplaod them to cloudinary, did avatar upload
    //create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res

  const {fullName , email, username, password}= req.body
  console.log("email:" , email)
  if ( [fullName , email, username , password].some((field) => {field?.trim() === ""  })){
    throw new ApiError(400, "all fields are required")
  }
const existedUser =await User.findOne({ $or: [{username} , {email}]})
if(existedUser){ 
  throw new ApiError(409 , "user with email or username already existed ")
}
// multer give access to req.files
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;
if( !avatarLocalPath){
   throw new ApiError(400, "Avatar file is required")
}
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "avatar file is required")
  }
 const user = await User.create( { 
    fullName, 
    avatar: avatar.url, 
    coverImage : coverImage?.url || "",
    email, 
    password, 
    username: username.toLowerCase()

  })

 const createdUser = await user.findById(user._id).select( 
        "-password -refreshToken"
          // if user is created createdUser will exist
         // these two fields will not be selected

 )
 if(!createdUser){
  throw new ApiError(500, "something went wrong while registering user ")
 }
 return res.status(201).json(
  new ApiResponse(200, createdUser, "User Registered successfully")
 )


})                    




const loginuser = () =>{ 

}
export {registerUser}
export {loginuser}