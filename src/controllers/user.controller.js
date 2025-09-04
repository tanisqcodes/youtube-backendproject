import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {mongoose} from "mongoose"


// we will take userId by user 
const generateAccessAndRefreshTokens = async(userId) => {
  try{
   const user = await User.findById(userId)
   const accessToken = user.generateAccessToken()
   const refreshToken = user.generateRefreshToken()

   user.refreshToken = refreshToken
  await  user.save({validatebeforeSave: false})
  return {accessToken, refreshToken}

  }catch(error){
    throw new ApiError(500 , 
      "something went wrog while generating refresh and access token")
  }
}






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

  const {fullName,email,username,password}= req.body
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
 // const coverImageLocalPath = req.files?.coverImage[0]?.path;

 let coverImageLocalPath; 
 if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
  coverImageLocalPath = req.files.coverImage[0].path 

 }






if( !avatarLocalPath){
   throw new ApiError(400, "Avatar file is required")
}
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "avatar file is required")
  }
 const user = await User.create({ 
    fullName, 
    avatar: avatar.url, 
    coverImage : coverImage?.url || "",
    email, 
    password, 
    username: username.toLowerCase()
    

  })
  if( user ) console.log("user was created")

 const createdUser = await User.findById(user._id).select("-password -refreshToken")
 // if user is created createdUser will exist
         // these two fields will not be selected
 if(!createdUser){
  throw new ApiError(500, "something went wrong while registering user ")
 }

if(0){
 console.log("request object:", req)
 console.log("user document in databse", user)
 console.log("existed user object", existedUser)
 console.log("avatar:", avatar) 
 console.log("coverImage:", coverImage)
 console.log("coverImageLocalPath: ", coverImageLocalPath)
 console.log("avatarLocalPath", avatarLocalPath)
}
 return res.status(201).json(
  new ApiResponse(200, createdUser, "User Registered successfully")
 )


})                    




const loginUser = asyncHandler(async(req, res) =>{ 
// reqbody -> data
//username or email
// find the user
//password check
// access and refresh token
// send cookies
// send response that successful login happened
const { email , username , password} = req.body
if( !username || !email){
  throw new ApiError(400, "username or email is required")

}

const user = await User.findOne({$or: [{username}, {email}]})

if(!user){ throw new ApiError(404, "User does not exist")}

const isPasswordValid = await user.isPasswordCorrect(password) // this will either be true or false

if(!isPasswordValid){ throw new ApiError(404 , "Invalid user credentials")}
const {accessToken , refreshToken} = await generateAccessAndRefreshTokens(user._id) 

// calling database again , loggedInUser is the user object with no password and refreshtoke field
const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

const options = {
  httpOnly: true , // these cookies will now only be modified by server
  secure: true
}

return res.status(200)
.cookie("accessToken", accessToken, options) // this will set cookies 
.cookie("refreshToken", refreshToken, options)
.json(
  new ApiResponse(200, {
    user: loggedInUser , accessToken, refreshToken // yet we are sending the tokens

  }, 
"User logged in successfully")
)



})
const logoutUser = asyncHandler( 
  async(req, res ) => { 

    User.findByIdAndUpdate(req.user._id, {
      $set: {
        refreshToken: undefined
      }
    }, 
  {
    new : true
  })
  const options = { 
    httpOnly: true, 
    secure: true
  }
  return res.status(200).clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json( new ApiResponse(200,{}, "user was logged out succesfully"))


  }
)
export {registerUser}
export {loginUser}