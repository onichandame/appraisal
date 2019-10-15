module.exports=function(err,req,res,next){
  if(!err)
    return Promise.resolve(res.status(200).download(path.resolve(global.outputpath,res.id),res.name))
  return Promise.resolve(res.status(err).send())
}
