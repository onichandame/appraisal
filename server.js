const path=require('path')
const express = require('express')
const cookieparser=require('cookie-parser')
const init=require(path.resolve(__dirname,'core','init.js'))

const app = express()
app.set('views','views')
app.set('view engine','pug')

const port=10000

init()
.then(mount)
.then(listen)
.then(require(path.resolve(__dirname,'core','calc.js')))

function mount(){
  app.use(express.static(path.resolve(__dirname,'public')))
  app.use(cookieparser())
   
  app.use('/newjob',require(path.resolve(__dirname,'core','newjob','main.js')))

  app.use('/monitor',require(path.resolve(__dirname,'core','monitor','main.js')))

  app.use(/\/\d+/,require(path.resolve(__dirname,'core','download','main.js')))

  //app.use('/',require(path.resolve(__dirname,'core','oauth','main.js')))

  return Promise.resolve()
}

function listen(){
  app.listen(port, ()=>{
    console.log('Listening on port '+port+'!')
  })

  return Promise.resolve()
}
