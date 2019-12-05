const sqlite=require('sqlite')
const path=require('path')

const connect=require(path.resolve(__dirname,'connect.js'))

module.exports=function(db){
  return connect()
    .then(db=>{
      return sqlite.close(db)
    })
}
