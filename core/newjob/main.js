const express=require('express')
const path=require('path')
var router=express.Router()

router.post('/',require(path.resolve(__dirname,'accept.js')))

module.exports=router
