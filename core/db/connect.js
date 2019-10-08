const path=require('path')
const config=require(path.resolve(__dirname,'config.js'))
const sqlite3=require('sqlite3').verbose()

function connect(){
  return config()
  .then((param)=>{
    var db=new sqlite3.Database(p.name,sqlite3.OPEN_READWRITE|sqlite3.OPEN_CREATE,(err)=>{
      return db
  })
}

module.exports=connect
