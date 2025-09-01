import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

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
const existedUser = User.findOne({ $or: [{username} , {email}]})
if(existedUser){ 
  throw new ApiError(409 , "user with email or username already existed ")
}
// multer give access to req.files
const avatarLocalPath = req.files?.avatar[0]?.path;
const coverImageLocalPath = req.files?.coverImage[0]?.path;
if( !avatarLocalPath){
   throw new ApiError(400, "Avatar file is required")
}

})                    
export {registerUser}