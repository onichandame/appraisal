const path=require('path')
const get=require(path.resolve(global.basedir,'core','config','get.js'))

const dft={
  name:'TableClient',
  cols:{
    name:'TEXT NOT NULL',
    location:'TEXT NOT NULL',
    secret:'TEXT NOT NULL',
    registration_date:'INT NOT NULL',
    count:'INT',
    priority:'INT NOT NULL'// bigger number higher priority starting from 1. 0 represents inactive client
  }
}

module.exports=function(){
  return get()
  .then(c=>{
    if(!(c&&c.oauth&&c.oauth.name&&c.oauth.cols))
      global.config.oauth=dft
    return global.config.oauth
  })
}
