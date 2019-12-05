/* Accepts MC input job.
 * Requires:
 * 1. file(FILE)
 * 2. engine(TEXT)
 * 3. id(INT)
 * Returns:
 * 1. ID(INT)
 */
const path=require('path')
const fs=require('fs')
const fsp=fs.promises
const insert=require(path.resolve(global.basedir,'core','db','insert.js'))
const formidable=require('formidable')
const logger=require(path.resolve(global.basedir,'core','logger','logger.js'))
const compressFile=require(path.resolve(global.basedir,'core','util','compressFile.js'))

/* 1: bad request(not file)
 * 2: input not received
 * 3: input invalid
 * 4: database error
 */
module.exports=function(req,res,next){
  return parsePost()
  .then(checkRequest)
  .then(saveFile)
  .then(finalize)
  .catch(handleError)
  .then(reply)

  function parsePost(){
    return new Promise((resolve,reject)=>{
      let form=new formidable.IncomingForm()
      form.maxFileSize=1024 * 1024 * 1024 * 5
      form.uploadDir=global.inputpath
      form.parse(req,(err,fields,files)=>{
        if(err)
          return reject(1)
        return resolve({fields:fields,files:files})
      })
    })
  }

  function checkRequest(form){
    const {fields,files}=form
    if(!(fields && fields.engine && fields.id)) return Promise.reject(1)
    const supported_engine=['mcnp6.1','phits','mc4nbp']
    let engine=fields.engine
    if(supported_engine.indexOf(engine)<0) return Promise.reject(1)
    else engine=supported_engine.indexOf(engine)
    return Promise.resolve({id:fields.id,files:files,engine:engine})
  }
  
  function saveFile(fe){
    const {id,files,engine}=fe

    if(!(files&&files.input)) return Promise.reject(1)

    return register()
    .then(rename)
    //.then(compress)
    .then(newid=>{
      return {new:newid,old:id}
    })

    function register(){
      return insert('TableTask',{
        submitted_at:new Date().getTime(),
        status:3,
        engine:engine,
        original_name:path.parse(files.input.name).name
      })
    }

    function rename(lastid){
      if(!(lastid && lastid>=0)) return Promise.reject(4)
      console.log(files.input.path)
      console.log(lastid.toString())
      return fsp.rename(files.input.path,path.resolve(global.inputpath,lastid.toString()))
      .then(()=>{return lastid})
    }

    /*
    function compress(id){
      return compressFile(path.resolve(global.inputpath,id.toString()))
      .then(()=>{return {new:id,old:fe.id}})
    }
    */
  }

  function finalize(ids){
    res.status(200)
    if(!ids.old)
      ids.old=''
    res.body=ids
    return Promise.resolve()
  }

  function handleError(e){
    switch(e){
      case 1:
        return logger.debug('Request invalid')
        .then(()=>{res.status(400)})
        break
      case 2:
        return logger.debug('No file received')
        .then(()=>{res.status(400)})
        break
      case 3:
        return logger.info('File invalid')
        .then(()=>{res.status(422)})
        break
      case 4:
        return logger.warn(`Server internal error during handling request ${JSON.stringify(e)}`)
        .then(()=>{res.status(500)})
        break
      default:
        return logger.warn(`Server internal error during handling request ${JSON.stringify(e)}`)
        .then(()=>{res.status(500)})
    }
  }

  function reply(){
    if(!res.statusCode) res.status(500)
    if(res.body)
      res.send(JSON.stringify(res.body))
    else
      res.send()
    return Promise.resolve(res)
  }
}
