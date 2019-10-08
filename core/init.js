const path=require('path')
const fs=require('fs')
const initDB=require(path.resolve(__dirname,'db','init.js'))
const initLog=require(path.resolve(__dirname,'logger','init.js'))

function exit(msg){
  console.log(msg)
  process.exit(1)
}

function init(){

  global.basedir=findBaseDir()

  return initDB()
  .then(()=>{return initLog()})
  .then(()=>{return initDoc()})
  .catch((err)=>{
    console.log(err)
    process.exit(1)
  })
}

function initDoc(){
  return new Promise((resolve,reject)=>{
    fs.access(path.resolve(__dirname,'doc'),(err)=>{
      if(err)
        exit('Failed to ')
      fs.stat(path.resolve(__dirname,'doc'),(err,stat)=>{
      })
    })
  })
}

function findBaseDir(){
  const files=['server.js','package.json']
  const dirs=['core','node_modules']
  let curdir=__dirname
  var result=false
  try{
    while(!result){
      let flag=true
      files.forEach((file)=>{
        const filename=path.resolve(curdir,file)
        if(!(fs.existsSync(filename)&&fs.statSync(filename).isFile()))
          flag=false
      })
      dirs.forEach((dir)=>{
        const dirname=path.resolve(curdir,dir)
        if(!(fs.existsSync(dirname)&&fs.statSync(dirname).isDirectory()))
          flag=false
      })
      if(!flag)
        curdir=path.resolve(curdir,'..')
      else
        result=curdir
    }
    return result
  }catch(e){
    console.log(e)
    process.exit(1)
  }
}

module.exports=init
