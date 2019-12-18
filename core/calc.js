const path=require('path')
const fs=require('fs')
const fsp=fs.promises
const rimraf=require('rimraf')
const subprocess=require('child_process').spawn

module.exports=async function(){

  const select=require(path.resolve(__dirname,'db','select.js'))
  const update=require(path.resolve(__dirname,'db','update.js'))

  return calc()

  function calc(){

    return clear()
    .then(start)
    .then(clean)
    .then(()=>{setImmediate(calc)})

    function clear(){
      return fsp.readdir(global.calcpath)
      .then(files=>{
        if(files.length) return empty()
        else return

        function empty(){
          let el=[]
          for(const file of files){
            const filename=path.resolve(global.calcpath,file)
            el.push(fsp.stat(filename).then(stat=>{return stat.isDirectory() ? new Promise((resolve,reject)=>{rimraf(filename,e=>{if(e) return reject(e);else return resolve()})}) : fsp.unlink(filename)}))
          }
          return Promise.all(el)
        }
      })
    }

    function start(){
      return select('TableTask',['rowid'],'status > 2 ORDER BY submitted_at ASC LIMIT 1')
      .then(rows=>{
        if(!(rows.length && rows[0] && Number.isInteger(rows[0].rowid))) return
        const id=rows[0].rowid
        return mkdir()
        .then(register)
        .then(spawn)

        function mkdir(){
          const dir=path.resolve(global.calcpath,id.toString())
          return fsp.access(dir)
          .then(()=>{
            return fsp.stat(dir)
            .then(stat=>{
              if(stat.isDirectory()) return fsp.rmdir(dir,{recursive:true})
              else return fsp.unlink(dir)
            })
          })
          .catch(e=>{
            if(e.code=='ENOENT') return Promise.resolve()
            else return Promise.reject(id)
          })
          .then(()=>{
            return fsp.mkdir(dir)
          })
        }

        function register(){
          return update('TableTask',{status:2,started_at:new Date().getTime()/1000},`rowid=${id}`)
        }

        function spawn(){
          return fsp.copyFile(path.resolve(global.inputpath,id.toString()),path.resolve(global.calcpath,id.toString(),'inp'))
          .then(()=>{
            return new Promise((resolve,reject)=>{
              const proc=subprocess('mcnp6',['tasks 4', `i=${path.resolve(global.calcpath,id.toString(),'inp')}`, `r=${path.resolve(global.calcpath,id.toString(),'res')}`, `m=${path.resolve(global.calcpath,id.toString(),'tal')}`, `o=${path.resolve(global.calcpath,id.toString(),'out')}`])
              proc.stdout.on('data',data=>{
                console.log(`${data}`)
              })

              proc.stderr.on('data',data=>{
                console.log(`${data}`)
              })

              proc.on('close',code=>{
                if(code) return reject(code)
                else return resolve(code)
              })
            })
          })
          .then(()=>{
            return update('TableTask',{status:1,finished_at:new Date().getTime()/1000},`rowid=${id}`)
          })
          .then(()=>{
            return fsp.copyFile(path.resolve(global.calcpath,id.toString(),'tal'),path.resolve(global.outputpath,id.toString()))
          })
          .then(()=>{
            return update('TableTask',{status:0},`rowid=${id}`)
          })
          .catch(e=>{
            console.log(e)
          })
        }
      })
    }
    
    function clean(){
      return fsp.readdir(global.basedir)
      .then(files=>{
        let temp_files=[]
        files.forEach(f=>{
          if(/^fort[a-zA-Z0-9]{5}$/.test(f))
            temp_files.push(fsp.unlink(path.join(global.basedir,f)))
        })
        return Promise.all(temp_files)
      })
    }
  }

  return Promise.resolve()
}

