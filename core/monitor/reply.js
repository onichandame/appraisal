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

/* 1: request invalid
 * 2: internal error
 */
module.exports=function(req,res,next){

  return checkRequest()
  .then(retrieveData)
  .then(parseData)
  .catch(handleError)
  .then(reply)

  function checkRequest(){
    const ids=req.query.id
    if(!(ids && Array.isArray(ids)))
      return Promise.reject(1)
    return Promise.resolve(ids)
  }

  function retrieveData(ids){
    return select('TableTask',['submitted_at','status','engine','started_at','finished_at','est','rowid AS id'],`rowid IN (${keys()})`)

    function keys(){
      return ids.join(',')
    }
  }

  function parseData(rows){
    res.status(200)
    res.body=rows
    return Promise.resolve()
  }

  function handleError(e){
    switch(e){
      case 1:
        res.status(400)
        break
      case 2:
        res.status(500)
        break
      default:
        res.status(500)
        break
    }
    return Promise.resolve()
  }

  function reply(){
    if(!res.statusCode) res.status(500)
    if(res.body) res.send(JSON.stringify(res.body))
    else res.send()
    return Promise.resolve()
  }
}
