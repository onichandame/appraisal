const path=require('path')
const fs=require('fs')
const fsp=require('fs').promises
const util=require('util')
const insert=require(path.resolve(global.basedir,'core','db','insert.js'))
const config=require(path.resolve(__dirname,'config.js'))
const save=require(path.resolve(global.basedir,'core','config','save.js'))

/* logger
 *
 * debug: verbose when not in production
 * info: things worth storage for future analysis
 * warn: non-blocking error
 * error: fatal error causing service to shutdown
 */

class MyLogger {
  constructor(opts){
    this.levels={error:0,
                 warn:1,
                 info:2,
                 debug:3
    }
  }

  log(obj){
    return config()
    .then(c=>{
      return insert(c.name,obj)
    })
  }
  compliment(message,lvl){
    return {message:message,level:this.levels.lvl,timestamp:new Date().toString()}
  }
  write(message,lvl){
    return this.log(this.compliment(message,lvl))
  }
  debug(message){
    return typeof v8debug==='object' ? this.write(message,'debug') : Promise.resolve()
  }
  info(message){
    return this.write(message,'info')
  }
  warn(message){
    return this.write(message,'warn')
  }
  error(message){
    const obj=compliment(message,'error')
    console.log(obj)
    return this.log(obj)
    .catch(err=>{
      return fsp.write(path.resolve(global.basedir,'error.log'),obj)
      .then(()=>{
        return exit()
      })
      .catch(e=>{
        return exit()
      })
    })
  }

  exit(){
    return save()
    .then(()=>{
    save()
    process.exit(1)
    })
  }
}
const logger=new MyLogger()

module.exports=logger
