/* Requires:
 * /\d+ id
 * 
 * Returns:
 * File
 */
let path=require('path')
const select=require(path.resolve(global.basedir,'core','db','select.js'))
const update=require(path.resolve(global.basedir,'core','db','update.js'))

/* 0/null: finished processing no error
 * 400: request invalid
 * 401: client invalid
 * 404: not found
 * 500: internal error
 */
module.exports=function(req,res,next){
  const id=req.baseUrl.substr(1)
  if(!/\d+/.test(id))
    return Promise.resolve(next(400))
  return select('TableTask',['original_name','status','finished_at'],'rowid='+id)
  .then(rows=>{
    if(!rows.length||rows.length>1)
      return Promise.resolve(next(404))
    res.id=rows[0].rowid
    res.name=rows[0].original_name+'.m' || rows[0].rowid+'.o'
    return next()
  })
}
