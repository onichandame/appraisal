const path=require('path')
const fs=require('fs')
const fsp=fs.promises

const filepath=path.resolve(global.basedir,'config.json')

function read(){
  return fsp.readFile(filepath,'utf8')
  .then(data=>{
    const config=JSON.parse(data)
    global.config=config
    return global.config
  })
  .catch(e=>{
    global.config={}
    return Promise.resolve(global.config)
  })
}

module.exports=read
