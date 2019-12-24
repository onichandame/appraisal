let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))

function select(tbl,target,cond){
  function getsql(){
    function getkv(){
      let k=''
      target.forEach(one=>{
        k+=one+','
      })
      return k.slice(0,-1)
    }
    return `SELECT ${getkv()} FROM ${tbl}${cond ? ` WHERE ${cond}` : ''}`
  }

  return connect()
  .then(db=>{
    if(!(tbl))
      return Promise.reject(new Error(`Require table name and target columns at least. Received ${JSON.stringify(tbl)} and ${JSON.stringify(target)}`))
    return db.all(getsql())
  })
}

module.exports=select
