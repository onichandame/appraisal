const path=require('path')
const config=require(path.resolve(__dirname,'config.js'))
const addtable=require(path.resolve(basedir,'core','db','addtable.js'))

function init(){
  return config()
  .then((c)=>{
    return addtable(c)
  })
}

module.exports=init
