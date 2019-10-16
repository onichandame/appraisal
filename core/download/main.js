const express=require('express')
const path=require('path')
var router=express.Router()

router.get('/',require(path.resolve(__dirname,'give.js')))

module.exports=router
