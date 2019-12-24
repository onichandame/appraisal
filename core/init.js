const path=require('path')
const fs=require('fs')
const fsp=fs.promises

function exit(msg){
  console.log(msg)
  process.exit(1)
}

async function init(){

  global.basedir=await initBaseDir()

  const initDB=require(path.resolve(__dirname,'db','init.js'))
  const initLog=require(path.resolve(__dirname,'logger','init.js'))

  return initDB()
  .then(initLog)
  .then(initDoc)
}

function initDoc(){
  const rootpath=path.resolve(global.basedir,'asset')

  return checkRoot()
  .then(()=>{
    global.assetpath=rootpath
    return
  })

  function checkRoot(){
    return checkPath(rootpath)
  }

  function checkPath(p){
    return exists()
    .then(access)
    .catch(handleError)

    function exists(){
      return fsp.stat(p)
      .then(stat=>{
        return stat.isDirectory() ? p : Promise.reject()
      })
    }

    function access(){
      return fsp.access(p,fs.constants.R_OK | fs.constants.W_OK)
    }

    function handleError(e){
      if(e.code=='ENOENT')
        return fsp.mkdir(p)
      else
        throw e
    }
  }
}

function initBaseDir(){
  const files=['server.js','package.json']
  const dirs=['core','node_modules']
  let curdir=__dirname
  var result=false
  return checkPath()
  .catch(checkPath)
  .catch(checkPath)
  .catch(checkPath)
  .catch(checkPath)

  function checkPath(e){
    if(e)
      return Promise.reject(e)
    var checks=[]
    files.forEach(file=>{
      const filename=path.resolve(curdir,file)
      checks.push(fsp.access(filename).then(()=>{
        return stat(filename).then(stat=>{
          return stat.isFile() ? Promise.resolve() : Promise.reject()
        })
      })
      .catch(e=>{
        if(e.code=='ENOENT')
          return Promise.reject()
      })
      )
    })
    dirs.forEach(dir=>{
      const dirname=path.resolve(curdir,dir)
      checks.push(fsp.access(dirname).then(()=>{
        return stat(dirname).then(stat=>{
          return stat.isDirectory() ? Promise.resolve() : Promise.reject()
        })
      })
      .catch(e=>{
        if(e.code=='ENOENT')
          return Promise.reject()
      })
      )
    })
    return Promise.all(checks)
    .then(()=>{return curdir})
    .catch(e=>{
      curdir=path.resolve(curdir,'..')
      return Promise.reject()
    })
  }
}

module.exports=init
