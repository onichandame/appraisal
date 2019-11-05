const path=require('path')
const select=require(path.resolve(global.basedir,'core','db','select.js'))
const update=require(path.resolve(global.basedir,'core','db','update.js'))
const logger=require(path.resolve(global.basedir,'core','logger','logger.js'))
const fs=require('fs')
const fsp=fs.promises

/* 1: request invalid
 * 2: not found
 * 3: internal error
 */
module.exports=function(req,res,next){
  return parseID()
  .then(getFile)
  .then(getName)
  .catch(handleError)
  .then(reply)

  function parseID(){
    const id=req.baseUrl.substr(1)
    if(!/\d+/.test(id))
      return Promise.reject(1)
    return Promise.resolve(id)
  }

  function getFile(id){
    return fsp.access(path.resolve(global.outputpath,id), fs.constants.F_OK | fs.constants.R_OK)
    .then(()=>{return id})
    .catch(e=>{
      return Promise.reject(2)
    })
  }

  function getName(id){
    return select('TableTask',['original_name','status','finished_at'],'rowid='+id)
    .then(rows=>{
      if(rows.length!=1)
        return Promise.reject(2)
      res.name=rows[0].original_name+'.m' || id+'.m'
      res.id=id
    })
  }

  function handleError(e){
    switch(e){
      case 1:
        res.status(400)
        break
      case 2:
        res.status(404)
        break
      default:
        res.status(500)
        break
    }
    return Promise.resolve()
  }

  function reply(){
    if(!res.statusCode)
      res.status(500)
    if(res.name && res.id) res.download(path.resolve(global.outputpath,res.id),res.name)
    else res.send()
    return Promise.resolve(res)
  }
}
