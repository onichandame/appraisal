const fs=require('fs')
const path=require('path')
const {exit}=require(path.resolve(__dirname,'base.js'))

function checkConfig(config){
  try{
    var obj=JSON.parse(fs.readFileSync(config))
    return true
  }catch(e){
    return false
  }
}
function initConfig(){
  const config_path=path.resolve(global.basedir,'config.json')
  if(checkConfig(config_path))
    global.config=config_path
  else
    exit('Config file not valid')
}
async function getConfig(callback){
  fs.readFile(global.config,(err,data)=>{
    if(err)
      exit(err.message)
    try{
      var conf=JSON.parse(data)
      return callback(conf)
    }catch(e){
      return exit(e)
    }
  })
}

module.exports={
  initConfig:initConfig,
  getConfig:getConfig
}
