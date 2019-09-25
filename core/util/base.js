const fs=require('fs')
function exit(message){
  if(message.message)
    console.log(message.message)
  else
    console.log(JSON.stringify(message))
  process.exit(1)
}
module.exports={
  exit:exit
}
