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

function mount(){
  app.use(express.static(path.resolve(__dirname,'public')))
  app.use(cookieparser())
   
  app.use('/',require(path.resolve(__dirname,'core','main.js')))

  return Promise.resolve()
}

function listen(){
  app.listen(port, ()=>{
    console.log('Listening on port '+port+'!')
  })

  return Promise.resolve()
}
