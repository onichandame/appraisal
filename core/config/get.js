const path=require('path')
const read=require(path.resolve(__dirname,'read.js'))

function get(){
  if(global.config)
    return Promise.resolve(global.config)
  else
    return read()
}

module.exports=get
