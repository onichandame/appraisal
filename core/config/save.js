const path=require('path')
const fs=require('fs')

const filepath=path.resolve(__dirname,'filepath.json')

function save(){
  return new Promise((resolve,reject)=>{
    if(!global.config)
      return reject('Config object not initialized')
    return fs.writeFile(filepath,JSON.stringify(global.config),(err)=>{
      if(err)
        throw err
      else
        return null
    })
  })
}

module.exports=save
