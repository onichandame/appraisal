let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))

let tabname=require(path.resolve(__dirname,'tabname.js'))

async function update(entries,cond,callback){
  connect((connection)=>{
    var sql='UPDATE '+tabname+' SET '
    for(const [key,val] of Object.entries(entries))
      sql+=key+'=?,'
    sql.slice(0,-1)
    sql+=' WHERE '+cond
    connection.query(sql,Object.values(entries),(err,results,fields)=>{
      if(err)
        exit(err)
      return callback(results.insertId)
    })
    connection.end()
  })
}

module.exports=update
