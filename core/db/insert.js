let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))

function insert(tbl,obj){
  function getsql(){
    function getkv(){
      var val=''
      var col=''
      for(const [k,v] of Object.entries(obj)){
        col+=k+','
        val+=typeof v === 'object' ? `'${JSON.stringify(v)}'` : `'${v}'`
        val+=','
      }
      col=col.slice(0,-1)
      val=val.slice(0,-1)
      return [col,val]
    }
    const kv=getkv()
    return `INSERT INTO ${tbl} (${kv[0]}) VALUES (${kv[1]})`
  }

  return connect()
  .then(db=>{
    if(!(tbl && obj))
      return Promise.reject(new Error('Require table name and a row, '+'received '+JSON.stringify(tbl)+' and '+JSON.stringify(obj)))
    return db.run(getsql())
    .catch(e=>{
      console.log(getsql())
      throw e
    })
    .then(sql=>{
      return sql.stmt.lastID
    })
  })
}

module.exports=insert
