const path=require('path')
const config=require(path.resolve(__dirname,'config.js'))
const sqlite=require('sqlite')

let db=false

function connect(){
  return config()
  .then(p=>{
    if(!db) db=sqlite.open(path.resolve(p.path,p.name),{Promise})
    return db
  })
  .catch(e=>{
    console.log(e)
  })
}

module.exports=connect
