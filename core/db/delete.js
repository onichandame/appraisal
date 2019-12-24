let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))

module.exports=function(tbl,cond){
  function getsql(){
    return `DELETE FROM ${tbl}${cond ? ` WHERE ${cond}` : ''}`
  }

  return connect()
  .then(db=>{
    if(!(tbl))
      return Promise.reject(new Error('Require table name at least, '+'received '+JSON.stringify(tbl)))
    return db.run(getsql())
  })
}
