const path=require('path')
const fs=require('fs')
const fsp=fs.promises

const filepath=path.resolve(__dirname,'filepath.json')

function save(){
  return fsp.writeFile(filepath,JSON.parse(global.config))
}

module.exports=save
