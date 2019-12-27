const path=require('path')
const express = require('express')
const cookieparser=require('cookie-parser')
const fs=require('fs')
const fsp=fs.promises
const checkpath=require('checkpath')

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
   
  app.use('/template',(req,res)=>{
    res.download(path.resolve(__dirname,'template.xlsx'),'航天学院2017-2019年度聘期考核工作量统计表.xlsx')
  })

  app.use('/latest',(req,res)=>{
    let fn=path.resolve(__dirname,'asset','output.xlsx')
    return checkpath(fn)
    .catch(e=>{
      if(e.code=='ENOENT') fn=path.resolve(__dirname,'template.xlsx')
      else throw e
    })
    .then(async ()=>{res.download(fn,'航天学院2017-2019年度聘期考核工作量统计表'+await fsp.stat(fn).then(stat=>{return `${stat.birthtime.getFullYear()}_${stat.birthtime.getMonth()+1}_${stat.birthtime.getDate()}`})+'.xlsx')})
  })

  app.use('/readme',(req,res)=>{
    res.set('Content-Type','application/pdf')
    res.set('Content-Dispisition','attachment;filename="readme.pdf"')
    fs.readFile(path.resolve(__dirname,'readme.pdf'),(err,data)=>{
      if(err) res.send('Server Internal Error')
      else res.send(data)
    })
  })

  app.use('/lock',require(path.resolve(__dirname,'core','lock.js')))

  app.use('/getlock',require(path.resolve(__dirname,'core','getlock.js')))

  app.use('/',require(path.resolve(__dirname,'core','main.js')))

  return Promise.resolve()
}

function listen(){
  app.listen(port, ()=>{
    console.log('Listening on port '+port+'!')
  })

  return Promise.resolve()
}
