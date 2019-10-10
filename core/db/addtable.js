const path=require('path')
const connect=require(path.resolve(__dirname,'connect.js'))

// schema:{
//   name: string
//   cols: {col name: col type}
// }
function addtable(schema){
  function getsql(){
    function getkv(){
      var result='('
      for(let [k,v] of Object.entries(schema.cols)){
        result+=`${k} ${v},`
      }
      return result.slice(0,-1)+')'
    }
    return `CREATE TABLE IF NOT EXISTS ${schema.name} ${getkv()}`
  }
  if(!(schema&&schema.name&&schema.cols))
    return Promise.reject('Requires table name and cols, received '+JSON.stringify(schema))
  return connect()
  .then((db)=>{
    return db.run(getsql())
  })
}

module.exports=addtable
