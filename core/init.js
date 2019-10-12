const path=require('path')
const fs=require('fs')
const fsp=fs.promises
const initDB=require(path.resolve(__dirname,'db','init.js'))
const initLog=require(path.resolve(__dirname,'logger','init.js'))

function exit(msg){
  console.log(msg)
  process.exit(1)
}

function init(){

  global.basedir=findBaseDir()

  return initDB()
  .then(initLog)
  .then(initDoc)
  .catch(e=>{exit(e)})
}

function initDoc(){
  const rootpath=path.resolve(__dirname,'asset')
  const uppath=path.resolve(rootpath,'upload')
  const downpath=path.resolve(rootpath,'downpath')

  return checkPath(rootpath)
  .then(checkPath(uppath))
  .then(checkPath(downpath))

  function checkPath(p){
    return exists()
    .then(isDir)

    function exists(){
      return fsp.access(p,fs.constants.R_OK | fs.constants.W_OK)
      .catch(e=>{
        if(e.code=='ENOENT')
          return fsp.mkdir(p)
        else
          throw e
      })
    }

    function isDir(){
      return fsp.stat(p)
      .then(stat=>{
        if(stat.isDirectory())
          return
        else 
          throw new Error('doc not directory')
      })
    }
  }
}

function findBaseDir(){
  const files=['server.js','package.json']
  const dirs=['core','node_modules']
  let curdir=__dirname
  var result=false
  try{
    let i=0
    while(!result&&i<5){
      ++i
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
  }catch(e){
    console.log(e)
    process.exit(1)
  }
}

module.exports=init
