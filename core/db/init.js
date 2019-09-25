let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))
let {exit}=require(path.resolve(__dirname,'..','util','base.js'))

const tabname=require(path.resolve(__dirname,'tabname.js'))
async function initDB(callback){
  connect((connection)=>{
    var sql='CREATE TABLE IF NOT EXISTS '+tabname+'(id INT UNSIGNED PRIMARY KEY,filename TEXT CHARSET utf8mb4 NOT NULL,status INT NOT NULL,startedat TEXT,finishat TEXT)'
    connection.query(sql,(err,results,fields)=>{
      if(err)
        return exit(err)
      var cols={}
      connection.query('SHOW fields from '+tabname)
        .on('error',(err)=>{return exit(err)})
        .on('result',(row)=>{
          cols[row.Field]={}
          cols[row.Field].type=row.Type
          cols[row.Field].nul=row.Null
          cols[row.Field].key=row.Key
        })
        .on('end',()=>{return callback()})
    })
  })
}

module.exports=initDB
