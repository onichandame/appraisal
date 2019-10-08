const path=require('path')
const fs=require('fs')

const filepath=path.resolve(__dirname,'filepath.json')

function read(){
  return new Promise((resolve,reject)=>{
    fs.readFile(filepath,(err,data)=>{
      if(err)
        return reject(err)
      try{
        const config=JSON.parse(data)
        return resolve(config)
      }catch(e){
        return reject(e)
      }
    })
  })
}

module.exports=read
