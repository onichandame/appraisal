let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))

function update(tbl,row,cond){
  function getsql(){
    function getkv(){
      let kv=''
      for(const [k,v] of Object.entries(row)){
        kv+=`${k}='${v}',`
      }
      return kv.slice(0,-1)
    }
    return `UPDATE ${tbl} SET ${getkv()} WHERE ${cond}`
  }
  return connect()
  .then(db=>{
    if(!(tbl&&row))
      return Promise.reject(new Error(`Requires table name and fields, received ${JSON.stringify(tbl)} and ${JSON.stringify(row)} and ${JSON.stringify(cond)}`))
    return db.run(getsql())
    .then(sql=>{
      return sql.stmt.changes
    })
  })
}

module.exports=update
