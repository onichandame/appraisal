/* Requires:
 * 1. [id] as json
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
 * 1: request invalid
 * 2: internal error
 */
module.exports=function(req,res,next){

  return parseRequest()
  .then(retrieveData)
  .then(parseData)
  .catch(handleError)
  .then(reply)

  function parseRequest(){
    const ids=req.query.id
    if(!(ids&&Array.isArray(ids)))
      return Promise.reject(1)
    return Promise.resolve(ids)
  }

  function retrieveData(ids){
    return select('TableTask',['submited_at','status','engine','started_at','finished_at','est','rowid AS id'],`rowid in (${keys()})`)

    function keys(){
      var key=''
      ids.forEach(id=>{
        key+=id+','
      })
      return key.slice(0,-1)
    }
  }

  function parseData(rows){
    res.body=rows
    return Promise.resolve()
  }

  function handleError(e){
    if(Number.isInteger(e)&&e==1)
      return Promise.resolve(400)
    else
      return Promise.resolve(500)
  }

  function reply(code){
    if(!code)
      code=200
    res.status(code)
    if(res.body)
      return Promise.resolve(res.send(res.body))
    else
      return Promise.resolve(res.send())
  }
}
