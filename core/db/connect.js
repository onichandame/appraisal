let {getConfig}=require(path.resolve(__dirname,'..','util','config.js'))
let {exit}=require(path.resolve(__dirname,'..','util','base.js'))

async function connect(callback){
  getParam((dbparam)=>{
    var connection=mysql.createConnection({
      host:dbparam.host,
      user:dbparam.user,
      password:dbparam.password,
      database:dbparam.database,
      charset:'utf8mb4_general_ci'
    })
    connection.connect((err)=>{
      if(err)
        exit(err)
      return callback(connection)
    })
  })
}

async function getParam(callback){
  getConfig((param)=>{
    const dbparam=param.db
    if(!(dbparam.host&&dbparam.database&&dbparam.user&&dbparam.password))
      exit('config file does not have enough database info')
    else
      callback(dbparam)
  })
}

module.exports=connect
