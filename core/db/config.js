const path=require('path')
const get=require(path.resolve(global.basedir,'core','config','get.js'))

const dft={
  path:path.resolve(global.basedir,'db'),
  name:'core.sqlite3'
}

function config(){
  return get()
  .then(c=>{
    if(!(c&&c.db&&c.db.path&&c.db.name))
      global.config.db=dft
    return global.config.db
  })
}

module.exports=config
