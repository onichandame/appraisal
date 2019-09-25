let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))
let {exit}=require(path.resolve(__dirname,'..','util','base.js'))

let tabname=require(path.resolve(__dirname,'tabname.js'))

async function insert(obj,callback){
  connect((connection)=>{
    var sql='INSERT INTO '+tabname+' ('
    var values=''
    for(const [key,val] of Object.entries(obj)){
      sql+=key+','
      values+='?,'
    }
    sql=sql.slice(0,-1)
    values=values.slice(0,-1)
    sql+=') VALUES ('+values+')'
    var options=Object.values(obj)
    connection.query(sql,options,(err,results,fields)=>{
      if(err)
        return exit(err)
      return callback(results.insertId)
    })
    connection.end()
  })
}

module.exports=insert
