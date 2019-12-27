const path=require('path')
const randomstring=require('randomstring')

const select=require(path.resolve(global.basedir,'core','db','select.js'))
const drop=require(path.resolve(global.basedir,'core','db','delete.js'))
const insert=require(path.resolve(global.basedir,'core','db','insert.js'))

module.exports=function(req,res){
  return select('TableLock',['*'])
  .then(rows=>{
    if(!rows.length) return true
    if(!rows[0].key) return true
    if(!rows[0].timestamp) return true
    if(new Date().getTime()-rows[0].timestamp>30*60*1000) return true
    return false
  })
  .then(flag=>{
    if(flag){
      return drop('TableLock')
      .then(()=>{
        const key=randomstring.generate({length:4,charset:'numeric'})
        return insert('TableLock',{key:key,timestamp:new Date().getTime()})
        .then(()=>{res.send(key)})
      })
    }else{
      res.render('locked.pug')
    }
  })
}
