const express=require("express");

const app=express()

app.use(express.json())

app.get("/health",(req,res)=>{
    res.status(200).json({
        success:true,
        service:"auth-service",
        status:"healthy"

    })
})

module.exports=app;