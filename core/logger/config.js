const path=require('path')
const get=require(path.resolve(global.basedir,'core','config','get.js'))

const dft={
  name:'TableLog',
  cols:{
    level:'INT NOT NULL',
    message:'TEXT NOT NULL',
    timestamp:'TEXT NOT NULL'
  }
}

function config(){
  return get()
  .then(c=>{
    if(!(c&&c.log&&c.log.tbl&&c.log.cols))
      global.config.log=dft
    return global.config.log
  })
}

module.exports=config
