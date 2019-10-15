let path=require('path')
const fs=require('fs')
const fsp=fs.promises
let connect=require(path.resolve(__dirname,'connect.js'))
const addtable=require(path.resolve(global.basedir,'core','db','addtable.js'))
const config=require(path.resolve(__dirname,'config.js'))

const schema={
  name:'TableTask',
  cols:{
    submited_at:'INT NOT NULL',
    status:'INT NOT NULL',// 0: finished & ready; 1: finished & post-processing; 2: calculating; 3: in queue; 4: not started; -1: failed
    engine:'INT NOT NULL',// 0: MCNP6.1; 1: PHITS; 2: MC4NBP
//    client:'INT NOT NULL', //will implement in future
    started_at:'TEXT',
    finished_at:'TEXT',
    original_name:'TEXT',
    est:'TEXT'
  }
}

function init(){
  return checkPath()
  .then(checkTable)

  function checkPath(){
    return config()
    .then(checkExists)
    .then(checkAccess)
    .catch(handleError)

    function checkExists(c){
      const dbpath=c.path
      return fsp.stat(dbpath)
      .then(stat=>{
        if(stat.isDirectory())
          return dbpath
        else return Promise.reject()
      })
    }

    function checkAccess(dbpath){
      return fsp.access(dbpath,fs.constants.R_OK | fs.constants.W_OK)
    }

    function handleError(e){
      if(e.code=='ENOENT')
        return config()
        .then(c=>{
          const dbpath=c.path
          fsp.mkdir(dbpath)
          .then(checkAccess)
        })
      else
        throw e
    }
  }

  function checkTable(){
    return addtable(schema)
  }
}

module.exports=init
