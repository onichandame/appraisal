const path=require('path')
const fs=require('fs')
const fsp=fs.promises
const insert=require(path.resolve(global.basedir,'core','db','insert.js'))
const select=require(path.resolve(global.basedir,'core','db','select.js'))
const drop=require(path.resolve(global.basedir,'core','db','delete.js'))
const formidable=require('formidable')
const logger=require(path.resolve(global.basedir,'core','logger','logger.js'))
const xlsx=require('xlsx')

const required_sheets=[
  "被考核人",
  "本科教学",
  "研究生教学",
  "研究项目",
  "项目经费到帐",
  "论文",
  "书籍"
]

module.exports=function(req,res,next){
  return parsePost()
  .then(calc)
  .then(finalize)
  .catch(handleError)
  .then(reply)

  function parsePost(){
    return new Promise((resolve,reject)=>{
      let form=new formidable.IncomingForm()
      form.maxFileSize=1024 * 1024 * 1024 * 5
      form.uploadDir=global.assetpath
      form.parse(req,(err,fields,files)=>{
        if(err)
          return reject(1)
        return resolve({fields:fields,files:files})
      })
    })
  }

  function calc(fe){
    const {files}=fe

    if(!(files&&files.input)) return Promise.reject(1)

    return checkSheets()
    .then(calculate)
    //.then(compress)
    .then(wb=>{
      xlsx.writeFile(wb,path.resolve(global.assetpath,'output.xls'))
    })

    function checkSheets(){
      var book=xlsx.readFile(files.input.path)
      for(let i=0;i<required_sheets.length;++i)
        if(!book.SheetNames.includes(required_sheets[i]))
          return Promise.reject(2)
      return Promise.resolve(book)
    }

    function calculate(wb){
      return populate()
      .then(compute)

      function populate(){
        return drop('TablePeople')
        .then(populatePeople)
        .then(()=>{return drop('TableUndergraduate')})
        .then(populateUndergraduate)
        .then(()=>{return drop('TablePostgraduate')})
        .then(populatePostgraduate)
        .then(()=>{return drop('TableProject')})
        .then(populateProject)
        .then(()=>{return drop('TableIncome')})
        .then(populateIncome)
        .then(()=>{return drop('TablePaper')})
        .then(populatePaper)
        .then(()=>{return drop('TableBook')})
        .then(populateBook)

        function populatePeople(){
          let people=wb.Sheets['被考核人']
          let fields={
            工号:false,
            姓名:false,
            岗位类型:false,
            技术等级:false,
            聘期起始:false,
            聘期结束:false
          }
          const head='ABCDEF'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==people[index].v)
                fields[people[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(3)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(people[`${fields['工号']}${row}`] == undefined){
              flag=false
              break
            }
            const id=people[`${fields['工号']}${row}`].v
            const name=people[`${fields['姓名']}${row}`].v
            const type=people[`${fields['岗位类型']}${row}`].v
            const level=people[`${fields['技术等级']}${row}`] ? people[`${fields['技术等级']}${row}`].v : undefined
            const start=ExcelDateToJSDate(people[`${fields['聘期起始']}${row}`].v)
            const end=ExcelDateToJSDate(people[`${fields['聘期结束']}${row}`].v)
            let sql={
              id:id,
              name:name,
              type:type ? (type=='教学科研' ? 0 : (type.includes('教学') ? 1 : (type.includes('科研') ? 2 : -1))) : -1,
              level:level,
              employed_from:start.getTime(),
              employed_til:end.getTime()
            }
            result.push(insert('TablePeople',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateUndergraduate(){
          let sheet=wb.Sheets['本科教学']
          let fields={
            负责人:false,
            所属学期:false,
            总课时:false
          }
          const head='ABC'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(4)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['总课时']}${row}`] == undefined){
              flag=false
              break
            }
            const hours=sheet[`${fields['总课时']}${row}`].v
            const term=sheet[`${fields['所属学期']}${row}`].v
            const host=sheet[`${fields['负责人']}${row}`] ? sheet[`${fields['负责人']}${row}`].v.match(/\[(.*?)\]/)[1] : undefined
            let sql={
              host:host,
              term:term,
              hours:hours
            }
            result.push(insert('TableUndergraduate',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populatePostgraduate(){
          let sheet=wb.Sheets['研究生教学']
          let fields={
            负责人:false,
            所属学期:false,
            总课时:false
          }
          const head='ABC'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(5)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['总课时']}${row}`] == undefined){
              flag=false
              break
            }
            const hours=sheet[`${fields['总课时']}${row}`].v
            const term=sheet[`${fields['所属学期']}${row}`].v
            const host=sheet[`${fields['负责人']}${row}`] ? sheet[`${fields['负责人']}${row}`].v : undefined
            let sql={
              host:host,
              term:term,
              hours:hours
            }
            result.push(insert('TablePostgraduate',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateProject(){
          let sheet=wb.Sheets['研究项目']
          let fields={
            项目代码:false,
            等级:false,
            主持人:false,
            起始日期:false,
            结束日期:false
          }
          const head='ABCDE'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(6)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['项目代码']}${row}`] == undefined){
              flag=false
              break
            }
            const id=sheet[`${fields['项目代码']}${row}`].v
            const level=sheet[`${fields['等级']}${row}`] ? sheet[`${fields['等级']}${row}`].v : undefined
            const host=sheet[`${fields['主持人']}${row}`] ? sheet[`${fields['主持人']}${row}`].v : undefined
            const start=sheet[`${fields['起始日期']}${row}`] ? new Date(sheet[`${fields['起始日期']}${row}`].v) : undefined
            const end=sheet[`${fields['结束日期']}${row}`] ? new Date(sheet[`${fields['结束日期']}${row}`].v) : undefined
            let sql={
              id:id,
              level:level,
              host:host,
              started_at:start ? start.getTime() : undefined,
              finished_at:end ? end.getTime() : undefined
            }
            result.push(insert('TableProject',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateIncome(){
          let sheet=wb.Sheets['项目经费到帐']
          let fields={
            项目代码:false,
            负责人:false,
            金额:false
          }
          const head='ABC'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(7)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['项目代码']}${row}`] == undefined){
              flag=false
              break
            }
            const project=sheet[`${fields['项目代码']}${row}`].v
            const host=sheet[`${fields['负责人']}${row}`] ? sheet[`${fields['负责人']}${row}`].v : undefined
            const amount=sheet[`${fields['金额']}${row}`] ? sheet[`${fields['金额']}${row}`].v : undefined
            let sql={
              project:project,
              host:host,
              amount:amount
            }
            result.push(insert('TableIncome',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populatePaper(){
          let sheet=wb.Sheets['论文']
          let fields={
            出版日期:false,
            期刊级别:false,
            收录类别:false,
            作者:false,
            负责人:false
          }
          const head='ABCDE'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(8)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['作者']}${row}`] == undefined){
              flag=false
              break
            }
            let author=sheet[`${fields['作者']}${row}`].v
            const host=sheet[`${fields['负责人']}${row}`] ? sheet[`${fields['负责人']}${row}`].v : undefined
            const cat=sheet[`${fields['收录类别']}${row}`] ? sheet[`${fields['收录类别']}${row}`].v : undefined
            const level=sheet[`${fields['期刊级别']}${row}`] ? sheet[`${fields['期刊级别']}${row}`].v : undefined
            const publish=sheet[`${fields['出版日期']}${row}`] ? new Date(sheet[`${fields['出版日期']}${row}`].v) : undefined
            author=author.split(',')
            for(let i=0;i<author.length;++i){
              author[i]=author[i].match(/\（(.*?)\）/) ? author[i].match(/\（(.*?)\）/)[1] : undefined
            }
            let sql={
              author:author,
              host:host,
              publish_at:publish.getTime(),
              category:cat ? (cat.includes('SCIE') ? 1 : 0) : 0,
              magazine:level ? (level.includes('核心') ? 1 : 0) : 0
            }
            result.push(insert('TablePaper',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateBook(){
          let sheet=wb.Sheets['书籍']
          let fields={
            出版日期:false,
            类别:false,
            作者:false
          }
          const head='ABC'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(9)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['作者']}${row}`] == undefined){
              flag=false
              break
            }
            let author=sheet[`${fields['作者']}${row}`].v
            const cat=sheet[`${fields['类别']}${row}`] ? sheet[`${fields['类别']}${row}`].v : undefined
            const publish=sheet[`${fields['出版日期']}${row}`] ? new Date(sheet[`${fields['出版日期']}${row}`].v) : undefined
            for(let i=0;i<author.length;++i){
              author[i]=author[i].match(/\（(.*?)\）/) ? author[i].match(/\（(.*?)\）/)[1] : undefined
            }
            let sql={
              author:author,
              publish_at:publish.getTime(),
              category:cat ? (cat.includes('编著') ? 0 : (cat.includes('专著') ? 1 : (cat.includes('教材') ? 2 : 0))) : -1
            }
            result.push(insert('TableBook',sql))
            ++row
          }
          return Promise.all(result)
        }
      }

      function compute(){
        let people=wb.Sheets['被考核人']
        let fields={
          工号:false,
          姓名:false,
          岗位类型:false,
          技术等级:false,
          聘期起始:false,
          聘期结束:false
        }
        const head='ABCDEF'
        for(let i=0;i<head.length;++i){
          let index=`${head[i]}1`
          for(let j=0;j<head.length;++j){
            if(Object.keys(fields)[j]==people[index].v)
              fields[people[index].v]=head[i]
          }
        }
        for(let i=0;i<head.length;++i)
          if(!Object.values(fields)) return Promise.reject(3)
        console.log(people.G1)
        const res_col_num='G'
        people['!ref']=`${people['!ref'].substr(0,3)}G${people['!ref'].substr(4,people['!ref'].length)}`
        people.G1={t:'s',v:'分数'}
        let row_num=2
        let id=people[`${fields['工号']}${row_num}`].v
        let result=[]
        while(id){
          let mark=0
          result.push(select('TablePeople',['*'],`id='${id}'`)
            .then(async rows=>{
              if(!rows.length) return
              const row=rows[0]
              if(row.type==0){
                if(row.level>1 && row.level<5){
                  const weight=1/6
                  const teach_base=64
                  let ug_hours=await select('TableUndergraduate',['hours'],`host='${id}'`)
                  let ug_mark=0
                  for(let i=0;i<ug_hours;++i){
                    let tmp=parseInt(rows[i].hours)
                    if(isNaN(tmp)) continue
                    ug_mark+=tmp
                  }
                  mark+=weight * ug_mark/teach_base
                  const proj_base=1
                  let proj=await(select('TableProject',[1],`host='${id}' AND started_at > ${row.employed_from} AND finished_at < ${row.employed_til}`))
                  mark+=weight * proj/proj_base
                  const income_base=120
                  let inc=await(select('TableIncome',['amount'],`host='${row.name}'`))
                  let inc_stack
                  for(let i=0;i<inc.length;++i){
                    let tmp=parseInt(rows[i].hours)
                    if(isNaN(tmp)) continue
                    inc_stack+=tmp
                  }
                  mark+=weight * inc_stack/income_base
                  const paper_base=1
                  let inc=await(select('TableIncome',['amount'],`host='${row.name}'`))
                }else if(row.level>4 && row.level<8){
                  const weight=1/6
                }else if(row.level>7 && row.level<11){
                  const weight=1/5
                }else{
                  mark=0
                }
              }else if(row.type==1){
                if(row.level>1 && row.level<5){
                  const weight=1/6
                }else if(row.level>4 && row.level<8){
                  const weight=1/6
                }else{
                  mark=0
                }
              }else if(row.type==2){
                if(row.level>1 && row.level<5){
                  const weight=1/5
                }else if(row.level>4 && row.level<8){
                  const weight=1/5
                }else if(row.level>7 && row.level<11){
                  const weight=1/5
                }else{
                  mark=0
                }
              }else{
                mark=0
              }
            })
          )
          people[`G${row_num}`]={t:'n',v:mark}
          ++row_num
          id=people[`${fields['工号']}${row_num}`] ? people[`${fields['工号']}${row_num}`].v : undefined
        }
        return Promise.all(result)
        .then(()=>{return wb})
      }
    }
  }

  function finalize(){
    res.status(200)
    res.file=path.resolve(global.assetpath,'output.xls')
    return Promise.resolve()
  }

  function handleError(e){
    console.log(e)
    switch(e){
      case 1:
        return logger.info('file not uploaded')
        .then(()=>{
          res.body='File not uploaded'
          res.status(400)
        })
        break
      case 2:
        return logger.info('file missing information')
        .then(()=>{
          res.body='Missing information in sheet'
          res.status(400)
        })
        break
      case 3:
        return logger.info('people sheet missing information')
        .then(()=>{
          res.body='people sheet missing information'
          res.status(400)
        })
        break
      case 4:
        return logger.info('undergraduate sheet missing information')
        .then(()=>{
          res.body='undergraduate sheet missing information'
          res.status(400)
        })
        break
      case 5:
        return logger.info('postgraduate sheet missing information')
        .then(()=>{
          res.body='postgraduate sheet missing information'
          res.status(400)
        })
        break
      case 6:
        return logger.info('project sheet missing information')
        .then(()=>{
          res.body='project sheet missing information'
          res.status(400)
        })
        break
      case 7:
        return logger.info('income sheet missing information')
        .then(()=>{
          res.body='income sheet missing information'
          res.status(400)
        })
        break
      case 8:
        return logger.info('paper sheet missing information')
        .then(()=>{
          res.body='paper sheet missing information'
          res.status(400)
        })
        break
      case 9:
        return logger.info('book sheet missing information')
        .then(()=>{
          res.body='book sheet missing information'
          res.status(400)
        })
        break
      default:
        return logger.warn(`Server internal error during handling request ${JSON.stringify(e)}`)
        .then(()=>{
          res.body='Server internal error'
          res.status(500)
        })
    }
  }

  function reply(){
    if(!res.statusCode) res.status(500)
    if(res.body)
      res.send(JSON.stringify(res.body))
    else if(res.file)
      res.download(res.file)
    else
      res.send()
    return Promise.resolve(res)
  }
}
function ExcelDateToJSDate(serial) {
   var utc_days  = Math.floor(serial - 25569);
   var utc_value = utc_days * 86400;                                        
   var date_info = new Date(utc_value * 1000);

   var fractional_day = serial - Math.floor(serial) + 0.0000001;

   var total_seconds = Math.floor(86400 * fractional_day);

   var seconds = total_seconds % 60;

   total_seconds -= seconds;

   var hours = Math.floor(total_seconds / (60 * 60));
   var minutes = Math.floor(total_seconds / 60) % 60;

   return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
}
