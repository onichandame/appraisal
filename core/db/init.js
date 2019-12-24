let path=require('path')
const fs=require('fs')
const fsp=fs.promises
const addtable=require(path.resolve(global.basedir,'core','db','addtable.js'))
const config=require(path.resolve(__dirname,'config.js'))

const schema=[
  {
    name:'TablePeople',
    cols:{
      id:'TEXT NOT NULL',
      name:'TEXT NOT NULL',
      type:'INT NOT NULL',// -1:其它；0: 教学科研; 1: 教学; 2: 科研
      level:'INT',
      employed_from:'INT',
      employed_til:'INT'
    }
  },
  {
    name:'TableUndergraduate',
    cols:{
      host:'TEXT',
      term:'TEXT NOT NULL',
      hours:'TEXT NOT NULL'
    }
  },
  {
    name:'TablePostgraduate',
    cols:{
      host:'TEXT',
      term:'TEXT NOT NULL',
      hours:'TEXT NOT NULL'
    }
  },
  {
    name:'TableProject',
    cols:{
      id:'TEXT NOT NULL',
      level:'TEXT',
      host:'TEXT',
      started_at:'INT',
      finished_at:'INT'
    }
  },
  {
    name:'TableIncome',
    cols:{
      project:'TEXT NOT NULL',
      host:'TEXT',
      amount:'INT',
    }
  },
  {
    name:'TablePaper',
    cols:{
      author:'TEXT NOT NULL',
      host:'TEXT',
      publish_at:'INT',
      category:'INT',//0:non-sci; 1:sci
      magazine:'INT'//0:normal; 1:core
    }
  },
  {
    name:'TableBook',
    cols:{
      author:'TEXT NOT NULL',
      category:'INT',//-1:未知; 0:编著; 1:专著; 2:教材
      publish_at:'INT',
    }
  }
]

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
    let result=[]
    for(let i=0;i<schema.length;++i)
      result.push(addtable(schema[i]))
    return Promise.all(result)
  }
}

module.exports=init
