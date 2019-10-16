/* Requires:
 * /\d+ id
 * 
 * Returns:
 * File
 */
let path=require('path')
const select=require(path.resolve(global.basedir,'core','db','select.js'))
const update=require(path.resolve(global.basedir,'core','db','update.js'))
const logger=require(path.resolve(global.basedir,'core','logger','logger.js'))
const fs=require('fs')
const fsp=fs.promises

/* 0/null: finished processing no error
 * 1: request invalid
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
    return fsp.access(path.resolve(global.outputpath,id))
    .then(()=>{return id})
    .catch(e=>{
      if(e.code=='ENOENT')
        return Promise.reject(2)
    })
  }

  function getName(id){
    return select('TableTask',['original_name','status','finished_at'],'rowid='+id)
    .then(rows=>{
      if(!rows.length||rows.length>1)
        return Promise.reject(404)
      res.name=rows[0].original_name+'.m' || id+'.m'
      res.id=id
      return
    })
  }

  function handleError(e){
    switch(e){
      case 0:
        return logger.debug('received invalid request')
        .then(()=>{return 400})
        break
      case 1:
        return logger.debug('file not found')
        .then(()=>{return 404})
        break
      default:
        return logger.warn(`internal failure ${JSON.stringify(e)}`)
    }
  }

  function reply(code){
    if(!code)
      code=200
    res.status(code)
    if(code==200&&res.name&&res.id)
      return Promise.resolve(res.download(path.resolve(global.outputpath,res.id),res.name))
    else
      return Promise.resolve(res.send())
  }
}
