/* Requires:
 * 1. [id] as json
 * 2. sid as cookies(implemented in future)
 *
 * Returns:
 * 1. submitted_at
 * 2. status
 * 3. engine
 * 4. started_at
 * 5. finished_at
 * 6. est
 * 7. id
 *
 * as json
 */
const path=require('path')
const select=require(path.resolve(global.basedir,'core','db','select.js'))

/* 0/null: no error
 * 400: request invalid
 * 401: client invalid
 * 500: internal error
 */
module.exports=function(req,res,next){
  const ids=req.body
  if(!(ids&&Array.isArray(ids)))
    return Promise.resolve(next(400))
  var key=''
  ids.forEach(id=>{
    if(!Number.isInteger(id))
      return Promise.resolve(next(400))
    key+=`${id},`
  })
  key=key.slice(0,-1)
  return select('TableTask',['submited_at','status','engine','started_at','finished_at','est','rowid AS id'],`rowid in (${key})`)
  .then(rows=>{
    res.body=rows
    return next()
  })
}
