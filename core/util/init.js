const path=require('path')
const fs=require('fs')
const {exit}=require(path.resolve(__dirname,'base.js'))
const initDB=require(path.resolve(__dirname,'..','db','init.js'))
const {initConfig}=require(path.resolve(__dirname,'config.js'))

async function init(callback){
  initGlobalDir()
  initDB(()=>{
    return callback()
  })
}
function initGlobalDir(){
  global.basedir=findBaseDir()
  initConfig()
}
function findBaseDir(){
  const files=['server.js','package.json']
  const dirs=['route','node_modules']
  let curdir=__dirname
  var result=false
  try{
    while(!result){
      let flag=true
      files.forEach((file)=>{
        const filename=path.resolve(curdir,file)
        if(!(fs.existsSync(filename)&&fs.lstatSync(filename).isFile()))
          flag=false
      })
      dirs.forEach((dir)=>{
        const dirname=path.resolve(curdir,dir)
        if(!(fs.existsSync(dirname)&&fs.lstatSync(dirname).isDirectory()))
          flag=false
      })
      if(flag)
        result=curdir
      else
        curdir=path.resolve(curdir,'..')
    }
  }catch(e){
    result=false
  }
  if(result)
    return result
  else 
    return exit('Failed to find basedir')
}

module.exports=init
