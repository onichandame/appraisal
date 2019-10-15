const express=require('express')
const path=require('path')
var router=express.Router()
const output=require(path.resolve(__dirname,'output.js'))

router.post('/',require(path.resolve(__dirname,'accept.js')),output)

router.get('/',(req,res,next)=>{res.render('newjob.pug')})

module.exports=router
