const path=require('path')
const insert=require(path.resolve(global.basedir,'core','db','insert.js'))

module.exports=function(req,res,next){
  const {id}=req.body
  if(!(PatientSex&&PatientName&&Doctor&&Collimator&&TotalCharge&&OrganDose))
    return output({code:422})
  req.body.SubmissionDate=new Date().toString()
  insert(req.body,(insertId)=>{
    res.locals.body=insertId
    return output()
  })
  function output(err){
    res.set('Connection','close')
    if(err){
      console.log(JSON.stringify(err))
      if(err.code)
        res.status(err.code)
      else
        res.status(500)
    }else{
      res.status(200)
    }
    if(res.locals.body)
      return res.send('<p>'+res.locals.body+'</p>')
    else
      return res.send()
  }
}
