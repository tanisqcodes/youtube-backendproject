import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import {mongoose} from "mongoose"
import jwt from "jwt"


// we will take userId by user 
const generateAccessAndRefreshTokens = async(userId) => {
  try{
   const user = await User.findById(userId)
   const accessToken = await user.generateAccessToken()
   const refreshToken = await user.generateRefreshToken()

   user.refreshToken = refreshToken
  await  user.save({validateBeforeSave: false})
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
if( !(username || email)){
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



const refreshAccessToken = asyncHandler(async(req, res) => { 
 const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
 if(!incomingRefreshToken){
  throw new ApiError(401 , "unauthorized request")
 }


 try {
  const decodedToken = jwt.verify(incomingRefreshToken, process.env.ACCESS_TOKEN_SECRET)
 
  const user = await User.findById(decodedToken?._id)
 
  if(!user){
   throw new ApiError("401", "invalid refresh Token provided by the client ")
  }
  if(incomingRefreshToken !== user?.refreshToken){
   throw new ApiError(401, "Refresh Token is expired or user")
 
  }
  const options = { 
   httpOnly: true , 
   secure: true
  }
  const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
  return res.status(200)
  .cookie("refreshToken", accessToken, options)
  .cookie("accessToken", newRefreshToken, options)
  .json(
   new ApiResponse(200, {
     accessToken , refreshToken: newRefreshToken
 
   }, "access token refreshed successfully ")
  )
 
 } catch (error) {
  throw new ApiError(410 , (error?.message + "incomingRefreshToken could not be decoded") || "invalid refresh token")
  
 }
})

const changeCurrentPassword = asyncHandler(async(req, res) => {  //uses auth.middleware
    const {oldPassword, newPassword, confirmPassword} = req.body 

    if(!(newPassword  === confirmPassword)){
      throw new ApiError(500 , "enter same password in both fields")
    }
    // we'll run auth.middleware to check if user is logged in pull in userId from there
  const user =  await User.findById( req.user?._id )
   // checking if the oldPassword entered is correct
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
    throw new ApiError(400 ,"Invalid Old Password" )

  }
user.password = newPassword
await user.save({validateBeforeSave: false})

return res.status(200)
.json( new ApiResponse(200 , {}, "Password changed successfully"))



})

const getCurrentUse = asyncHandler( async(req, res) => { 
  if( req.user?.id){
    return res.status(200)
    .json(
      200, req.user, "current user fetched successfully" 
    ) 

  }
  throw new ApiError()
})

const updateAccountDetails = asyncHandler( async( req, res) => { 
  const {fullName , email } = req.body
  if( !fullName || !email ){
    throw new ApiError(400, "all fields are required")
  }
  const user = User.findByIdAndUpdate(
    req.user?._id, { 
      $set: { 
        fullName : fullName , 
        email: email
      }

    }, 
    {
      new: true
    }
  ).select( "-password")

  return res.status(200),json(
    new ApiResponse(200, "Account details updated successfully ")
  )
})
const updateUserAvatar = asyncHandler(async( req, res )=> { // we'll use multer middleware
  // which will give us req.files , here one file is present 

  // we'll also have to use the auth.middleware to get to know the current user to 
  // upload the avatar in database
 const avatarLocalPath =  req.files?.path
 const userid = req.user?._id
 if( !avatarLocalPath){
  throw new ApiError(400, " avatar file is missing")
 }
const avatar =  await uploadOnCloudinary(avatarLocalPath)
if( !(avatar?.url) ){
throw new ApiError(400 , "error while uploading on cloudinary")
}
})
await User.findByI
if( userid ){
  throw new ApiError(400 , "userId could not be found for updating the avatar")
}



export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword
  , getCurrentUse, updateAccountDetails
}
