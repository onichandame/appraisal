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
  return checkRequest()
  .then(saveFile)
  .then(finalize)
  .catch(handleError)

  function checkRequest(){
    if(!(req.body&&req.body.engine))
      return Promise.reject(1)
    const supported_engine=[0,1,2]
    let engine=-1
    switch(req.body.engine.toLowerCase()){
      case 'mcnp6.1':
        engine=0
        break
      case 'phits':
        engine=1
        break
      case 'mc4nbp':
        engine=2
        break
      default:
        engine=-1
    }
    if(supported_engine.indexOf(engine)<0){
      return Promise.reject(1)
    }
    return Promise.resolve()
  }
  
  function saveFile(){
    return new Promise((resolve,reject)=>{
      var form=new formidable.IncomingForm()
      form.parse(req)
      form.on('fileBegin',(name,file)=>{
        console.log('started')
        file.path=global.inputpath
      })
      form.on('progress',(cur,tot)=>{
        console.log(cur/total*100+'%')
      })
      form.on('end',(name,file)=>{
        return resolve(name)
        console.log('done')
      })
      form.on('error',e=>{
        return reject(2)
      })
    })
  }

  function finalize(name){
    if(!name)
      return Promise.reject(2)
    return insert('TableTask',{
      submited_at:new Date().getTime(),
      status:4,
      engine:engine,
      original_name:path.parse(name).name
    })
    .then(alloc)
    .then(compress)
    .then(reply)

    function alloc(r){
      const id=r.lastID
      if(id<0)
        return Promise.reject(4)
      const filepath=path.resolve(global.inputpath,id)
      fsp.access(filepath)
      .then(()=>{fsp.unlink(filepath)})
      .then(rename)
      .catch(rename)

      function rename(){
        return fsp.rename(path.resolve(global.inputpath,name),filepath)
        .then(()=>{return id})
      }
    }

    function compress(id){
      return compressFile(path.resolve(global.inputpath,id))
      .then(()=>{return id})
    }

    function reply(id){
      console.log(id)
      res.body=id
      return next()
    }
  }

  function handleError(e){
    switch(e){
      case 0:
        return logger.debug('received job but error thrown')
        .then(next)
        break
      case 1:
        return logger.debug(`received unsupported request of ${req.body.engine}`)
        .then(()=>{return next(400)})
        break
      case 2:
        return logger.debug(`received request but not file`)
        .then(()=>{return next(400)})
        break
      case 3:
        return logger.info('received request but invalid file')
        .then(()=>{return next(422)})
        break
      case 4:
        return logger.warn(`error during handling request ${JSON.stringify(e)}`)
        .then(()=>{return next(500)})
        break
      default:
        return logger.warn(`error during handling request ${JSON.stringify(e)}`)
        .then(()=>{return next(500)})
    }
  }
}
