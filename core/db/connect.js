const path=require('path')
const config=require(path.resolve(__dirname,'config.js'))
const sqlite=require('sqlite')

function connect(){
  return config()
  .then(p=>{
    const db=sqlite.open(path.resolve(p.path,p.name),{Promise})
    return db
  })
}

module.exports=connect
