const path=require('path')

const select=require(path.resolve(global.basedir,'core','db','select.js'))

module.exports=function(req,res){
  return select('TableLock',['*'])
  .then(rows=>{
    if(!rows.length || new Date().getTime()-rows[0].timestamp>30*60*1000) return res.send('尚未记录有效上传码')
    res.send(rows[0].key)
  })
}
