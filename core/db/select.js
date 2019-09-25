let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))

let tabname=require(path.resolve(__dirname,'tabname.js'))

async function select(target,cond,callback,finish){
  connect((connection)=>{
    var sql='SELECT '
    for(const i of target)
      sql+=i+','
    sql=sql.slice(0,-1)
    sql+=' FROM '+tabname+' WHERE '+cond
    var num=0
    connection.query(sql)
      .on('error',(err)=>{return exit(err)})
      .on('result',(row)=>{
        ++num 
        callback(row)
      })
      .on('end',()=>{finish(num)})
    connection.end()
  })
}

module.exports=select
