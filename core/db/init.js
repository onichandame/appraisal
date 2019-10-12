let path=require('path')
const fs=require('fs')
const fsp=fs.promises
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
  return checkPath()
  .then(connect)
  .then(checkTable)

  function checkPath(){
    const dbpath=path.resolve(global.basedir,'db')
    return fsp.stat(dbpath)
    .then(stat=>{
      if(stat.isDirectory())
        return checkAccess()
      else
        return Promise.reject(0)

      function checkAccess(){
        return fsp.access(dbpath,fs.constants.R_OK | fs.constants.W_OK)
      }
    })
    .catch(e=>{
      if(e)
        throw e
      else
        return fsp.mkdir(dbpath)
    })
  }

  function checkTable(){
    return addtable(schema)
  }
}

module.exports=init
