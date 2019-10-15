const express=require('express')
const path=require('path')
var router=express.Router()
const output=path.require(__dirname,'output.js')

router.use('/newclient',require(path.resolve(__dirname,'newclient.js')),output)

router.use('/authorise',require(path.resolve(__dirname,'authorise.js')),output)

router.use('/delclient',require(path.resolve(__dirname,'delclient.js')),output)

module.exports=router
