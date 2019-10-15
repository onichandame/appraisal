const fs=require('fs')
const fsp=fs.promises
const zlib=require('zlib')

module.exports=function(i,o){
  o=o || i
  return fsp.readFile(i)
  .then(compress)
  .then(write)

  function compress(buf){
    zlib.gzip(buf,function(e,r){
      if(e)
        return Promise.reject()
      else
        return Promise.resolve(r)
    })
  }

  function write(buf){
    return fsp.writeFile(o)
  }
}
