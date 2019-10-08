let path=require('path')
let connect=require(path.resolve(__dirname,'connect.js'))
const addtable=require(global.basedir,'core','db','addtable.js')

const schema={
  name:'TableTask',
  cols:{
    submit_at:'TEXT NOT NULL',
    status:'INT NOT NULL',
    started_at:'TEXT',
    finished_at:'TEXT',
    est:'TEXT'
  }
}

function init(){
  return connect()
  .then((db)=>{
    return addtable(schema)
  })
}

module.exports=init
