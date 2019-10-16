/* Accepts MC input job.
 * Requires:
 * 1. file(FILE)
 * 2. engine(TEXT)
 * 3. sid(cookies) implemented in future
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

/* Error code:
 * 0: no error
 * 1: bad request(not file)
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
    if(!(fields&&fields.engine))
      return Promise.reject(1)
    const supported_engine=['mcnp6.1','phits','mc4nbp']
    let engine=fields.engine
    if(supported_engine.indexOf(engine)<0)
      return Promise.reject(1)
    else
      engine=supported_engine.indexOf(engine)
    return Promise.resolve({files:files,engine:engine})
  }
  
  function saveFile(fe){
    const {files,engine}=fe
    if(!(files&&files.input))
      return Promise.reject(1)
    return register()
    .then(rename)
    .then(compress)

    function register(){
      return insert('TableTask',{
        submited_at:new Date().getTime(),
        status:4,
        engine:engine,
        original_name:path.parse(files.input.name).name
      })
    }

    function rename(sql){
      const id=sql.stmt.lastID
      if(!(id&&id>=0))
        return Promise.reject(4)
      return fsp.rename(files.input.path,path.resolve(global.inputpath,id.toString()))
      .then(()=>{return id})
    }

    function compress(id){
      return compressFile(path.resolve(global.inputpath,id.toString()))
      .then(()=>{return id})
    }
  }

  function finalize(id){
    res.body=id.toString()
    return Promise.resolve()
  }

  function handleError(e){
    switch(e){
      case 0:
        return logger.debug('received job but error thrown')
        .then(()=>{return 0})
        break
      case 1:
        return logger.debug(`received request of unsupported engine`)
        .then(()=>{return 400})
        break
      case 2:
        return logger.debug(`received request but not file`)
        .then(()=>{return 400})
        break
      case 3:
        return logger.info('received request but invalid file')
        .then(()=>{return 422})
        break
      case 4:
        return logger.warn(`error during handling request ${JSON.stringify(e)}`)
        .then(()=>{return 500})
        break
      default:
        return logger.warn(`error during handling request ${JSON.stringify(e)}`)
        .then(()=>{return 500})
    }
  }

  function reply(code){
    if(!code)
      res.status(200)
    if(res.body)
      return Promise.resolve(res.send(res.body))
    else
      return Promise.resolve(res.send())
  }
}
