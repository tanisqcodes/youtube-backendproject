import mongoose, {Schema } from "mongoose"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema = new Schema({
    username: {
        type: String , 
        required : true , 
        unique: true, 
        lowercase: true,
        trim: true , 
        index: true,
    }, 
    email: { 
        type: String , 
        required: true , 
        unique: true, 
        lowercase: true, 
        trim: true , 
        index: true

    }, 
    fullName: { 
        type: String , 
        required: true , 
        
        trim: true , 
        index: true

    }, 
    avatar: {
        type: String , // cloudinary url
        required: true, 

    }, 
    coverImage: {
        type: String, 

    }, 
    watchHistory: [
        {
            type:Schema.Types.ObjectId, 
            ref: "Video"
        }
    ], 
    password: {
type: String, 
required: [true, 'password is required ']



    }, 
    refreshToken: {
        type: String
    }

}, {timestamps: true})


userSchema.pre("save", async function (next){
    if(this.isModified("password")){
        this.password = await bcrypt.hash(this.password, 10)
        next()

    }else{  
        return next()


    }
})
userSchema.methods.isPasswordCorrect = async function(password){
  return await bcrypt.compare(password , this.password) //this returns a true or false
}

userSchema.methods.generateAccessToken = function(){
    jwt.sign(
        { // giving payload
            _id: this._id,
            email: this.email, 
            username: this .username, 
            fullName: this.fullName, // this.fullName is from database , fullname is key in payload



        }, process.env.ACCESS_TOKEN_SECRET, 
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }


    )
}
userSchema.methods.generateRefreshToken = function(){
    jwt.sign(
        { // giving payload
            _id: this._id,
            // refresh token is used more frequently , it has only id



        }, process.env.REFRESH_TOKEN_SECRET, 
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }


    )
}
export const User = mongoose.model("User",userSchema )