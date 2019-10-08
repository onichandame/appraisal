const path=require('path')
const express = require('express')
const cookieparser=require('cookie-parser')
const bodyparser=require('body-parser')
const init=require(path.resolve(__dirname,'core','init.js'))

const port=8080
const app = express()

app.use(bodyparser.json())
app.use(bodyparser.urlencoded({extended: false}))
app.use(cookieparser())

init()
.then(()=>{
  app.use('/newjob',require(path.resolve(__dirname,'core','newjob','main.js')))
  app.use('/monitor',require(path.resolve(__dirname,'core','monitor','main.js')))
  app.use(/\/\d+/,require(path.resolve(__dirname,'core','download','main.js')))
  app.listen(port, function (){
    console.log('Listening on port '+port+'!')
  })
})
