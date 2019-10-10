const path=require('path')
const get=require(path.resolve(global.basedir,'core','config','get.js'))

const dft={
  path:path.resolve(global.basedir,'db'),
  name:'core.sqlite3'
}

function config(){
  return get()
  .then((c)=>{
    const p=c.db
    if(!(p&&p.path&&p.name))
      global.config.db=dft
    return global.config.db
  })
}
