// import mongoose from 'mongoose'
 // import {DB_NAME} from "./constants"
// require('dotenv').config({ path:  './env'})
import connectDB from "./db/index.js"
import {app} from "./app.js"




import dotenv from "dotenv"

dotenv.config({
    path: './.env'
})


connectDB()
.then(() => { 
    app.listen( process.env.PORT || 8000, () => { 
        console.log(`server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => { 
    console.log("MONGODB CONNECTION ERROR::", err)

})






/*

{ async ()=> { 
    try{  
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error", (error)=>{
            console.log("error", error )
            throw error
        })  // this is a listener for error
        app.listen(process.env.PORT, ()=>{ 
            console.log(`App is listening on port ${process.env.PORT}`)

        })

    }catch(error){
        console.log("ERROR: ", error)
        throw error

    }
}

}
*/