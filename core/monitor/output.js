module.exports=function(err,req,res,next){
  if(err)
    if(Number.isInteger(err))
      return Promise.resolve(res.status(err).send())
  else
    if(res.body)
      return Promise.resolve(res.status(200).send(res.body))
    else
      return Promise.resolve(res.status(200).send())
}
