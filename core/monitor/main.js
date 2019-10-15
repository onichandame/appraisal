const express=require('express')
const path=require('path')
var router=express.Router()
const output=require(path.resolve(__dirname,'output.js'))

router.post('/',require(path.resolve(__dirname,'reply.js')),output)

module.exports=router
