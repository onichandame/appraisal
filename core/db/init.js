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
      level:'INT',//-1:未知; 0:省部; 1:国家; 2:国际
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
      category:'INT',//0:normal; 1:ei; 2:sci;
      magazine:'INT'//0:normal; 1:core 2:supercore
    }
  },
  {
    name:'TableBook',
    cols:{
      author:'TEXT NOT NULL',
      category:'INT',//-1:未知; 0:编著; 1:专著; 2:教材
      publish_at:'INT',
    }
  },
  {
    name:'TableEliteCourse',
    cols:{
      year:'INT NOT NULL',
      host:'TEXT NOT NULL',
      level:'INT'//-1:未知; 0:校级; 1:国家级
    }
  },
  {
    name:'TableThesisAward',
    cols:{
      teacher:'TEXT NOT NULL',
      year:'INT'
    }
  },
  {
    name:'TableTeachAward',
    cols:{
      participant:'TEXT NOT NULL',
      year:'INT',
      level:'INT',//-1:未知;0:校级;1:省部级;2:国家级
      award:'INT',//-1:未知;0:特等奖;1:一等奖;2:二等奖;3:三等奖
    }
  },
  {
    name:'TablePatent',
    cols:{
      participant:'TEXT NOT NULL',
      date:'INT'
    }
  },
  {
    name:'TableResearchAward',
    cols:{
      participant:'TEXT NOT NULL',
      year:'INT',
      level:'INT',//-1:未知;0:部省级;1:国家级
      award:'INT'//-1:未知;1:一等奖;2:二等奖;3:三等奖
    }
  },
  {
    name:'TableStudentAward',
    cols:{
      teacher:'TEXT NOT NULL'
    }
  },
  {
    name:'TableLock',
    cols:{
      key:'TEXT NOT NULL',
      timestamp:'INT NOT NULL'
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
