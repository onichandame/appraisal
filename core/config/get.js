const path=require('path')
const read=require(__dirname,'read.js')

function get(){
  return new Promise((resolve,reject)=>{
    if(global.config)
      return resolve(global.config)
    else
      return read()
  })
}

module.exports=get
