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
  "科创",
  "班主任",
  "研究生教学",
  "研究项目",
  "项目经费到帐",
  "论文",
  "书籍",
  "精品课程",
  "优秀毕业论文",
  "教学成果奖",
  "专利",
  "科研成果奖",
  "学生竞赛"
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
    .then(fe=>{
      if(!(fe && fe.fields && fe.fields.key && fe.files && fe.files.input)) return Promise.reject(1)
      const fn=path.resolve(global.assetpath,'input.'+fe.files.input.name.split('.').pop())
      return select('TableLock',['*'])
      .then(rows=>{
        if(!rows.length) return Promise.reject(0)
        if(!rows[0].key) return Promise.reject(0)
        if(new Date().getTime()-rows[0].timestamp>30*60*1000) return Promise.reject(0)
        if(fe.fields.key!=rows[0].key) return Promise.reject(0)
      })
      .then(()=>{
        return fsp.rename(fe.files.input.path,fn)
      })
      .then(()=>{
        return fn
      })
    })
  }

  function calc(fn){
    return checkSheets()
    .then(calculate)
    .then(wb=>{
      xlsx.writeFile(wb,path.resolve(global.assetpath,'output.xlsx'))
    })

    function checkSheets(){
      var book=xlsx.readFile(fn)
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
        .then(()=>{console.log('people populated')})
        .then(()=>{return drop('TableUndergraduate')})
        .then(populateUndergraduate)
        .then(()=>{console.log('undergraduate populated')})
        .then(()=>{return drop('TablePostgraduate')})
        .then(populatePostgraduate)
        .then(()=>{console.log('postgraduate populated')})
        .then(()=>{return drop('TableProject')})
        .then(populateProject)
        .then(()=>{console.log('project populated')})
        .then(()=>{return drop('TableIncome')})
        .then(populateIncome)
        .then(()=>{console.log('income populated')})
        .then(()=>{return drop('TablePaper')})
        .then(populatePaper)
        .then(()=>{console.log('paper populated')})
        .then(()=>{return drop('TableBook')})
        .then(populateBook)
        .then(()=>{console.log('book populated')})
        .then(()=>{return drop('TableEliteCourse')})
        .then(populateEliteCourse)
        .then(()=>{console.log('elite course populated')})
        .then(()=>{return drop('TableThesisAward')})
        .then(populateThesisAward)
        .then(()=>{console.log('thesis award populated')})
        .then(()=>{return drop('TableTeachAward')})
        .then(populateTeachAward)
        .then(()=>{console.log('teach award populated')})
        .then(()=>{return drop('TablePatent')})
        .then(populatePatent)
        .then(()=>{console.log('patent populated')})
        .then(()=>{return drop('TableResearchAward')})
        .then(populateResearchAward)
        .then(()=>{console.log('research award populated')})
        .then(()=>{return drop('TableStudentAward')})
        .then(populateStudentAward)
        .then(()=>{console.log('student award populated')})

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
            const level=people[`${fields['技术等级']}${row}`] ? people[`${fields['技术等级']}${row}`].v : 0
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
          let result=[]
          let sheet=wb.Sheets['本科教学']
          let fields={
            负责人:false,
            所属学期:false,
            总课时:false
          }
          let head='ABC'
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
          while(flag){
            if(sheet[`${fields['总课时']}${row}`] == undefined){
              flag=false
              break
            }
            const hours=sheet[`${fields['总课时']}${row}`].v
            const term=sheet[`${fields['所属学期']}${row}`].v
            const host=(sheet[`${fields['负责人']}${row}`] && sheet[`${fields['负责人']}${row}`].v.match(/\[(.*?)\]/)) ? sheet[`${fields['负责人']}${row}`].v.match(/\[(.*?)\]/)[1] : undefined
            let sql={
              host:host,
              term:term,
              hours:hours
            }
            result.push(insert('TableUndergraduate',sql))
            ++row
          }
          sheet=wb.Sheets['科创']
          fields={
            指导老师:false,
            项目级别:false
          }
          head='AB'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(4)
          flag=true
          row=2
          while(flag){
            if(sheet[`${fields['指导老师']}${row}`] == undefined){
              flag=false
              break
            }
            const teacher=sheet[`${fields['指导老师']}${row}`].v
            const level=sheet[`${fields['项目级别']}${row}`] ? sheet[`${fields['项目级别']}${row}`].v : undefined
            let sql={
              host:teacher,
              term:2019.3,
              hours:level ? ((level.includes('校') ? 0.5 : (level.includes('省') ? 0.75 : (level.includes('国家') ? 1 : 0)))*12) : 0
            }
            result.push(
              select('TablePeople',['id'],`name='${teacher}'`)
              .then(rows=>{
                if(rows.length) return rows[0].id
                else return ''
              })
              .then(id=>{
                sql.host=id
                return insert('TableUndergraduate',sql)
              })
            )
            ++row
          }
          sheet=wb.Sheets['班主任']
          fields={
            姓名:false,
            折算学时:false
          }
          head='AB'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(4)
          flag=true
          row=2
          while(flag){
            if(sheet[`${fields['姓名']}${row}`] == undefined){
              flag=false
              break
            }
            const teacher=sheet[`${fields['姓名']}${row}`].v
            const hours=sheet[`${fields['折算学时']}${row}`] ? sheet[`${fields['折算学时']}${row}`].v : undefined
            let sql={
              host:teacher,
              term:2019.4,
              hours:Number.isInteger(hours) ? hours  : 0
            }
            result.push(
              select('TablePeople',['id'],`name='${teacher}'`)
              .then(rows=>{
                if(rows.length) return rows[0].id
                else return ''
              })
              .then(id=>{
                sql.host=id
                return insert('TableUndergraduate',sql)
              })
            )
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
            const host=sheet[`${fields['负责人']}${row}`] ? sheet[`${fields['负责人']}${row}`].v : ''
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
            const level=sheet[`${fields['等级']}${row}`] ? sheet[`${fields['等级']}${row}`].v : ''
            const host=sheet[`${fields['主持人']}${row}`] ? sheet[`${fields['主持人']}${row}`].v : ''
            const start=sheet[`${fields['起始日期']}${row}`] ? new Date(sheet[`${fields['起始日期']}${row}`].v) : 0
            const end=sheet[`${fields['结束日期']}${row}`] ? new Date(sheet[`${fields['结束日期']}${row}`].v) : 0
            let sql={
              id:id,
              level:level ? (level.includes('国际') ? 2 : (level.includes('国家') ? 1 : (level.includes('省') ? 0 : -1))) : -1,
              host:host,
              started_at:start ? start.getTime() : 0,
              finished_at:end ? end.getTime() : 0
            }
            result.push(insert('TableProject',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateIncome(){
          let sheet=wb.Sheets['项目经费到帐']
          let fields={
            负责人:false,
            金额:false
          }
          const head='AB'
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
            if(sheet[`${fields['负责人']}${row}`] == undefined){
              flag=false
              break
            }
            const host=sheet[`${fields['负责人']}${row}`].v
            const amount=sheet[`${fields['金额']}${row}`] ? sheet[`${fields['金额']}${row}`].v : 0
            let sql={
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
            负责人:false
          }
          const head='ABCD'
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
            if(sheet[`${fields['负责人']}${row}`] == undefined){
              flag=false
              break
            }
            const host=sheet[`${fields['负责人']}${row}`] ? sheet[`${fields['负责人']}${row}`].v : ''
            const cat=sheet[`${fields['收录类别']}${row}`] ? sheet[`${fields['收录类别']}${row}`].v : undefined
            const level=sheet[`${fields['期刊级别']}${row}`] ? sheet[`${fields['期刊级别']}${row}`].v : undefined
            const publish=sheet[`${fields['出版日期']}${row}`] ? new Date(sheet[`${fields['出版日期']}${row}`].v) : 0
            let sql={
              host:host,
              publish_at:publish.getTime(),
              category:cat ? cat.includes('SCI') ? 2 : (cat.includes('EI') ? 1 : 0) : 0,
              magazine:level ? (level.includes('重要核心') ? 2 : (level.includes('核心') ? 1 : 0)) : 0
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
            const cat=sheet[`${fields['类别']}${row}`] ? sheet[`${fields['类别']}${row}`].v : -1
            const publish=sheet[`${fields['出版日期']}${row}`] ? new Date(sheet[`${fields['出版日期']}${row}`].v) : 0
            author=author.split(',')
            for(let i=0;i<author.length;++i){
              author[i]=author[i].match(/\（(.*?)\）/) ? author[i].match(/\（(.*?)\）/)[1] : ''
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

        function populateEliteCourse(){
          let sheet=wb.Sheets['精品课程']
          let fields={
            立项年份:false,
            主持人:false,
            立项等级:false
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
            if(!Object.values(fields)) return Promise.reject(10)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['主持人']}${row}`] == undefined){
              flag=false
              break
            }
            let host=sheet[`${fields['主持人']}${row}`].v
            const level=sheet[`${fields['立项等级']}${row}`].v
            const year=sheet[`${fields['立项年份']}${row}`] ? sheet[`${fields['立项年份']}${row}`].v : 0
            host=host.split('/')
            let sql={
              host:host,
              year:year,
              level:level ? (level.includes('校') ? 0 : (level.includes('国家') ? 1 : -1)) : -1
            }
            result.push(insert('TableEliteCourse',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateThesisAward(){
          let sheet=wb.Sheets['优秀毕业论文']
          let fields={
            指导教师:false,
            获奖年份:false
          }
          const head='AB'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(11)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['指导教师']}${row}`] == undefined){
              flag=false
              break
            }
            const teacher=sheet[`${fields['指导教师']}${row}`].v
            const year=sheet[`${fields['获奖年份']}${row}`] ? sheet[`${fields['获奖年份']}${row}`].v : 0
            let sql={
              teacher:teacher,
              year:year ? year : -1
            }
            result.push(insert('TableThesisAward',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateTeachAward(){
          let sheet=wb.Sheets['教学成果奖']
          let fields={
            年度:false,
            完成人:false,
            等级:false,
            获奖等级:false
          }
          const head='ABCD'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(12)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['完成人']}${row}`] == undefined){
              flag=false
              break
            }
            let participant=sheet[`${fields['完成人']}${row}`].v
            const year=sheet[`${fields['年度']}${row}`] ? sheet[`${fields['年度']}${row}`].v : 0
            const level=sheet[`${fields['等级']}${row}`] ? sheet[`${fields['等级']}${row}`].v : ''
            const award=sheet[`${fields['获奖等级']}${row}`] ? sheet[`${fields['获奖等级']}${row}`].v : ''
            participant=participant.split('/')
            let sql={
              participant:participant,
              year:year ? year : -1,
              level:level ? (level.includes('校') ? 0 : (level.includes('省部') ? 1 : (level.includes('国家') ? 2 : -1))) : -1,
              award:award ? (award.includes('特等') ? 0 : (award.includes('一等') ? 1 : (award.includes('二等') ? 2 : (award.includes('三等') ? 3 : -1)))) : -1
            }
            result.push(insert('TableTeachAward',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populatePatent(){
          let sheet=wb.Sheets['专利']
          let fields={
            发明人:false,
            授权公告日:false
          }
          const head='AB'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(13)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['发明人']}${row}`] == undefined){
              flag=false
              break
            }
            let participant=sheet[`${fields['发明人']}${row}`].v
            const date=sheet[`${fields['授权公告日']}${row}`] ? ExcelDateToJSDate(sheet[`${fields['授权公告日']}${row}`].v) : 0
            if(participant.includes('/'))
              participant=participant.split('/')
            else
              participant=participant.split(' ')
            let sql={
              participant:participant,
              date:date ? date.getTime() : -1
            }
            result.push(insert('TablePatent',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateResearchAward(){
          let sheet=wb.Sheets['科研成果奖']
          let fields={
            年度:false,
            级别:false,
            等级:false,
            完成人:false
          }
          const head='ABCD'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(13)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['完成人']}${row}`] == undefined){
              flag=false
              break
            }
            let participant=sheet[`${fields['完成人']}${row}`].v
            let year=sheet[`${fields['年度']}${row}`] ? sheet[`${fields['年度']}${row}`].v : 0
            const level=sheet[`${fields['级别']}${row}`] ? sheet[`${fields['级别']}${row}`].v : ''
            const award=sheet[`${fields['等级']}${row}`] ? sheet[`${fields['等级']}${row}`].v : ''
            year=parseInt(year.substr(0,year.length))
            if(isNaN(year)) year=0
            participant=participant.split('、')
            let sql={
              participant:participant,
              year:year ? year : -1,
              award:award ? (award.includes('一') ? 1 : (award.includes('二') ? 2 : (award.includes('三') ? 3 : -1))) : -1,
              level:level ? (level.includes('部省') ? 0 : (level.includes('国家') ? 1 : -1)) : -1
            }
            result.push(insert('TableResearchAward',sql))
            ++row
          }
          return Promise.all(result)
        }

        function populateStudentAward(){
          let sheet=wb.Sheets['学生竞赛']
          let fields={
            工号:false
          }
          const head='A'
          for(let i=0;i<head.length;++i){
            let index=`${head[i]}1`
            for(let j=0;j<head.length;++j){
              if(Object.keys(fields)[j]==sheet[index].v)
                fields[sheet[index].v]=head[i]
            }
          }
          for(let i=0;i<head.length;++i)
            if(!Object.values(fields)) return Promise.reject(14)
          let flag=true
          let row=2
          let result=[]
          while(flag){
            if(sheet[`${fields['工号']}${row}`] == undefined){
              flag=false
              break
            }
            const teacher=sheet[`${fields['工号']}${row}`].v
            let sql={
              teacher:teacher
            }
            result.push(insert('TableStudentAward',sql))
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
        const res_col_num='G'
        const sub_col_num='H'
        const lab_col_num='I'
        people['!ref']=`${people['!ref'].substr(0,3)}I${people['!ref'].substr(4,people['!ref'].length)}`
        people.G1={t:'s',v:'分数'}
        people.H1={t:'s',v:'分项分数'}
        people.I1={t:'s',v:'必要项已完成'}
        let result=[]
        let max_row=parseInt(people['!ref'].substr(4,people['!ref'].length))
        for(let row_num=2;row_num<=max_row;++row_num){
          let id=people[`${fields['工号']}${row_num}`].v
          result.push(select('TablePeople',['*'],`id='${id}'`)
            .then(async rows=>{
              let mark=0
              let sub_mark=[]
              let done_must='True'
              let _row_=row_num
              if(!rows.length) return
              const row=rows[0]
              if(row.type==0){
                if(row.level>1 && row.level<5){
                  // 教学科研2-4
                  const weight=1/6

                  // Teaching hours
                  let teach_mark=await getTeachMark(64)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Projects
                  const proj_base=1
                  let proj=await getProject(0)
                  mark+=weight * proj/proj_base
                  sub_mark.push(proj/proj_base || 0)

                  // Income
                  const income_base=120
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark.push(inc/income_base || 0)

                  // Teach Award
                  let teach_award=0
                  const elite_course_base=1
                  let elite_course=await getEliteCourse({level:0,min_pos:1})
                  teach_award+=elite_course/elite_course_base
                  const thesis_award_base=1
                  let thesis_award=await getThesisAward()
                  teach_award+=thesis_award/thesis_award_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  teach_award+=student_award/student_award_base
                  const spe_teach_award_base=1
                  let spe_teach_award=await getTeachAward({
                    0:{
                      0:2,
                      1:1
                    },
                    1:{
                      1:4,
                      2:3,
                      3:2
                    },
                    2:{
                      0:5,
                      1:5,
                      2:5,
                      3:5
                    }
                  })
                  teach_award+=spe_teach_award/spe_teach_award_base
                  mark+=weight*teach_award
                  sub_mark.push(teach_award)
                  if(teach_award<1) done_must='False'

                  // Research Award
                  let research_award=0
                  const research_paper_base=16
                  let research_papers=await getPaper()
                  research_award+=research_papers/research_paper_base
                  const patent_base=2
                  let patent=await getPatent({min_pos:3})
                  research_award+=patent/patent_base
                  const book_base=1
                  let book=await getBook({min_pos:3})
                  research_award+=book/book_base
                  const spe_research_award_base=1
                  let spe_research_award=await getResearchAward({
                    0:{
                      1:5,
                      2:4,
                      3:3
                    },
                    1:{
                      1:6,
                      2:6,
                      3:6
                    }
                  })
                  research_award+=spe_teach_award/spe_research_award_base
                  mark+=weight*research_award
                  sub_mark.push(research_award)
                  if(research_award<1) done_must='False'

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else if(row.level>4 && row.level<8){
                  // 教学科研5-7
                  const weight=1/6

                  // Teaching hours
                  let teach_mark=await getTeachMark(64)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Projects
                  const proj_base=1
                  let proj=await getProject(0)
                  mark+=weight * proj/proj_base
                  sub_mark.push(proj/proj_base || 0)

                  // Income
                  const income_base=90
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark.push(inc/income_base || 0)

                  // Teach Award
                  let teach_award=0
                  const elite_course_base=1
                  let elite_course=await getEliteCourse({level:0,min_pos:2})
                  teach_award+=elite_course/elite_course_base
                  const thesis_award_base=1
                  let thesis_award=await getThesisAward()
                  teach_award+=thesis_award/thesis_award_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  teach_award+=student_award/student_award_base
                  const spe_teach_award_base=1
                  let spe_teach_award=await getTeachAward({
                    0:{
                      0:3,
                      1:2,
                      2:1
                    },
                    1:{
                      1:5,
                      2:4,
                      3:3
                    },
                    2:{
                      0:5,
                      1:5,
                      2:5,
                      3:5
                    }
                  })
                  teach_award+=spe_teach_award/spe_teach_award_base
                  mark+=weight*teach_award
                  sub_mark.push(teach_award)
                  if(teach_award<1) done_must='False'

                  // Research Award
                  let research_award=0
                  const research_paper_base=12
                  let research_papers=await getPaper()
                  research_award+=research_papers/research_paper_base
                  const patent_base=1
                  let patent=await getPatent({min_pos:3})
                  research_award+=patent/patent_base
                  const book_base=1
                  let book=await getBook({min_pos:3})
                  research_award+=book/book_base
                  const spe_research_award_base=1
                  let spe_research_award=await getResearchAward({
                    0:{
                      1:5,
                      2:4,
                      3:3
                    },
                    1:{
                      1:6,
                      2:6,
                      3:6
                    }
                  })
                  research_award+=spe_teach_award/spe_research_award_base
                  mark+=weight*research_award
                  sub_mark.push(research_award)
                  if(research_award<1) done_must='False'

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else if(row.level>7 && row.level<11){
                  // 教学科研8-10
                  const weight=1/4

                  // Teaching hours
                  let teach_mark=await getTeachMark(64)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Projects
                  const proj_base=1
                  let proj=await getProject(1)
                  mark+=weight * proj/proj_base
                  sub_mark.push(proj/proj_base || 0)

                  // Income
                  const income_base=60
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark[sub_mark.length-1]+=(inc/income_base || 0)

                  // Award
                  let award=0
                  const paper_base=10
                  let papers=await getPaper()
                  award+=papers/paper_base
                  const patent_base=2
                  let patent=await getPatent({min_pos:3})
                  award+=patent/patent_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  award+=student_award/student_award_base
                  const spe_award_base=1
                  let spe_award=await getTeachAward({
                    0:{
                      0:4,
                      1:3,
                      2:2
                    },
                    1:{
                      1:6,
                      2:5,
                      3:4
                    },
                    2:{
                      0:7,
                      1:7,
                      2:7,
                      3:7
                    }
                  })
                  spe_award+=await getResearchAward({
                    0:{
                      1:6,
                      2:5,
                      3:4
                    },
                    1:{
                      1:7,
                      2:7,
                      3:7
                    }
                  })
                  award+=spe_award/spe_award_base
                  mark+=weight * award
                  sub_mark.push(award || 0)

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else{
                  mark=0
                }
              }else if(row.type==1){
                if(row.level>1 && row.level<5){
                  // 教学2-4
                  const weight=1/6

                  // Teaching hours
                  let teach_mark=await getTeachMark(192)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Teaching Reformation
                  mark+=weight * 0
                  sub_mark.push(0 || 0)

                  // Undergraduate Teaching Experiment
                  mark+=weight * 0
                  sub_mark.push(0 || 0)

                  // Award
                  let award=0
                  const paper_base=6
                  let papers=await getPaper()
                  award+=papers/paper_base
                  const elite_course_base=1
                  let elite_course=await getEliteCourse({level:0,min_pos:1})
                  award+=elite_course/elite_course_base
                  const thesis_award_base=1
                  let thesis_award=await getThesisAward()
                  award+=thesis_award/thesis_award_base
                  const book_base=1
                  let book=await getBook({min_pos:3})
                  award+=book/book_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  award+=student_award/student_award_base
                  const spe_award_base=1
                  let spe_award=await getTeachAward({
                    0:{
                      0:2,
                      1:1
                    },
                    1:{
                      1:4,
                      2:3,
                      3:2
                    },
                    2:{
                      0:5,
                      1:5,
                      2:5,
                      3:5
                    }
                  })
                  spe_award+=await getResearchAward({
                    0:{
                      1:4,
                      2:3,
                      3:2
                    },
                    1:{
                      1:5,
                      2:5,
                      3:5
                    }
                  })
                  award+=spe_award/spe_award_base
                  award*=0.5
                  mark+=weight*research_award
                  sub_mark.push(research_award)
                  if(award<1) done_must='False'

                  // Income
                  const income_base=30
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark.push(inc/income_base || 0)

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else if(row.level>4 && row.level<8){
                  // 教学5-7
                  const weight=1/6

                  // Teaching hours
                  let teach_mark=await getTeachMark(144)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Teaching Reformation
                  mark+=weight * 0
                  sub_mark.push(0 || 0)

                  // Undergraduate Teaching Experiment
                  mark+=weight * 0
                  sub_mark.push(0 || 0)

                  // Award
                  let award=0
                  const paper_base=5
                  let papers=await getPaper()
                  award+=papers/paper_base
                  const elite_course_base=1
                  let elite_course=await getEliteCourse({level:0,min_pos:2})
                  award+=elite_course/elite_course_base
                  const thesis_award_base=1
                  let thesis_award=await getThesisAward()
                  award+=thesis_award/thesis_award_base
                  const book_base=1
                  let book=await getBook({min_pos:3})
                  award+=book/book_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  award+=student_award/student_award_base
                  const spe_award_base=1
                  let spe_award=await getTeachAward({
                    0:{
                      0:2,
                      1:1
                    },
                    1:{
                      1:5,
                      2:4,
                      3:3
                    },
                    2:{
                      0:6,
                      1:6,
                      2:6,
                      3:6
                    }
                  })
                  spe_award+=await getResearchAward({
                    0:{
                      1:5,
                      2:4,
                      3:3
                    },
                    1:{
                      1:6,
                      2:6,
                      3:6
                    }
                  })
                  award+=spe_award/spe_award_base
                  award*=0.5
                  mark+=weight*research_award
                  sub_mark.push(research_award)
                  if(award<1) done_must='False'

                  // Income
                  const income_base=20
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark.push(inc/income_base || 0)

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else{
                  mark=0
                }
              }else if(row.type==2){
                if(row.level>1 && row.level<5){
                  // 科研2-4
                  const weight=1/5

                  // Teaching hours
                  let teach_mark=await getTeachMark(24)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Projects
                  const proj_base=1
                  let proj=await getProject(1)
                  if(id=='70204326') console.log(mark)
                  mark+=weight * proj/proj_base
                  if(id=='70204326') console.log(mark)
                  sub_mark.push(proj/proj_base || 0)

                  // Income
                  const income_base=180
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark.push(inc/income_base || 0)

                  // Research Award
                  let research_award=0
                  const paper_base=20
                  let papers=await getPaper()
                  research_award+=papers/paper_base
                  const patent_base=3
                  let patent=await getPatent({min_pos:3})
                  research_award+=patent/patent_base
                  const book_base=1
                  let book=await getBook({min_pos:3})
                  research_award+=book/book_base
                  const thesis_award_base=2
                  let thesis_award=await getThesisAward()
                  research_award+=thesis_award/thesis_award_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  research_award+=student_award/student_award_base
                  const spe_research_award_base=1
                  let spe_research_award=await getResearchAward({
                    0:{
                      1:3,
                      2:2
                    },
                    1:{
                      1:4,
                      2:4,
                      3:4
                    }
                  })
                  research_award+=spe_research_award/spe_research_award_base
                  research_award*=0.5
                  mark+=weight*research_award
                  sub_mark.push(research_award)
                  if(research_award<1) done_must='False'

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else if(row.level>4 && row.level<8){
                  // 科研5-7
                  const weight=1/5

                  // Teaching hours
                  let teach_mark=await getTeachMark(24)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Projects
                  const proj_base=1
                  let proj=await getProject(0)
                  mark+=weight * proj/proj_base
                  sub_mark.push(proj/proj_base || 0)

                  // Income
                  const income_base=120
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark.push(inc/income_base || 0)

                  // Research Award
                  let research_award=0
                  const paper_base=16
                  let papers=await getPaper()
                  research_award+=papers/paper_base
                  const patent_base=2
                  let patent=await getPatent({min_pos:3})
                  research_award+=patent/patent_base
                  const book_base=1
                  let book=await getBook({min_pos:3})
                  research_award+=book/book_base
                  const thesis_award_base=1
                  let thesis_award=await getThesisAward()
                  research_award+=thesis_award/thesis_award_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  research_award+=student_award/student_award_base
                  const spe_research_award_base=1
                  let spe_research_award=await getResearchAward({
                    0:{
                      1:4,
                      2:3,
                      3:2
                    },
                    1:{
                      1:5,
                      2:5,
                      3:5
                    }
                  })
                  research_award+=spe_research_award/spe_research_award_base
                  research_award*=0.5
                  mark+=weight*research_award
                  sub_mark.push(research_award)
                  if(research_award<1) done_must='False'

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else if(row.level>7 && row.level<11){
                  // 科研8-10
                  const weight=1/5

                  // Teaching hours
                  let teach_mark=await getTeachMark(24)
                  mark+=weight * teach_mark
                  sub_mark.push(teach_mark || 0)

                  // Projects
                  const proj_base=1
                  let proj=await getProject(0)
                  mark+=weight * proj/proj_base
                  sub_mark.push(proj/proj_base || 0)

                  // Income
                  const income_base=75
                  let inc = await getIncome()
                  mark+=weight * inc/income_base
                  sub_mark.push(inc/income_base || 0)

                  // Research Award
                  let research_award=0
                  const paper_base=12
                  let papers=await getPaper()
                  research_award+=papers/paper_base
                  const patent_base=2
                  let patent=await getPatent({min_pos:3})
                  research_award+=patent/patent_base
                  const student_award_base=1
                  let student_award=await getStudentAward()
                  research_award+=student_award/student_award_base
                  const spe_research_award_base=1
                  let spe_research_award=await getResearchAward({
                    0:{
                      1:5,
                      2:4,
                      3:3
                    },
                    1:{
                      1:6,
                      2:6,
                      3:6
                    }
                  })
                  research_award+=spe_research_award/spe_research_award_base
                  research_award*=0.5
                  mark+=weight*research_award
                  sub_mark.push(research_award)

                  // Group Activity
                  mark+=weight * 1
                  sub_mark.push(1 || 0)
                }else{
                  mark=0
                }
              }else{
                mark=0
              }

              people[`G${_row_}`]={t:'n',v:mark}
              people[`H${_row_}`]={t:'s',v:JSON.stringify(sub_mark)}
              people[`I${_row_}`]={t:'s',v:JSON.stringify(done_must)}

              function getTeachMark(base){
                return getUgHours()
                .then(ug_hours=>{
                  return getPgHours()
                  .then(pg_hours=>{
                    return (ug_hours+pg_hours)/(3*base*(row.employed_til-row.employed_from)/94521600000)
                  })
                })
              }

              function getUgHours(){
                return select('TableUndergraduate',['hours'],`host='${id}'`)
                .then(rows=>{
                  let ug_mark=0
                  for(let i=0;i<rows.length;++i){
                    let tmp=parseInt(rows[i].hours)
                    if(isNaN(tmp)) continue
                    ug_mark+=tmp
                  }
                  return ug_mark
                })
              }

              function getPgHours(){
                return select('TablePostgraduate',['hours'],`host='${id}'`)
                .then(rows=>{
                  let ug_mark=0
                  for(let i=0;i<rows.length;++i){
                    let tmp=parseInt(rows[i].hours)
                    if(isNaN(tmp)) continue
                    ug_mark+=tmp
                  }
                  return ug_mark
                })
              }

              function getProject(min_lvl){
                min_lvl=min_lvl | 0
                return select('TableProject',[1],`host='${id}' AND started_at >= ${row.employed_from} AND level >= ${min_lvl}`)
                .then(rows=>{
                  return rows.length
                })
              }

              function getIncome(){
                return select('TableIncome',['amount'],`host='${row.name}'`)
                .then(rows=>{
                  let inc_stack=0
                  for(let i=0;i<rows.length;++i){
                    inc_stack+=rows[i].amount
                  }
                  return inc_stack
                })
              }

              function getPaper(){
                return select('TablePaper',['category','magazine'],`host='${row.name}'`)
                .then(rows=>{
                  let result=0
                  rows.forEach(r=>{
                    if(r.category==2) result+=4
                    else if(r.category==1) result+=2
                    else if(r.magazine==2) result+=2
                    else if(r.magazine==1) result+=1
                  })
                  return result
                })
              }

              function getEliteCourse(prop){
                if(!prop) prop={}
                const min_lvl=prop.level | 0
                const min_pos=prop.position | 1
                return select('TableEliteCourse',['host'],`host LIKE '%${row.name}%' AND level >= ${min_lvl}`)
                .then(rows=>{
                  let result=0
                  for(let i=0;i<rows.length;++i)
                    if(JSON.parse(rows[i].host).indexOf(row.name)<min_pos) ++result
                  return result
                })
              }

              function getThesisAward(){
                return select('TableThesisAward',[1],`teacher = '${row.name}'`)
                .then(rows=>{
                  return rows.length
                })
              }

              function getTeachAward(prop){
                return select('TableTeachAward',['participant','level','award'],`participant LIKE '%${row.name}%'`)
                .then(rows=>{
                  let result=0
                  for(let i=0;i<rows.length;++i)
                    if(Object.keys(prop).includes(rows[i].level.toString()))
                      if(Object.keys(prop[rows[i].level]).includes(rows[i].award.toString()))
                        if(JSON.parse(rows[i].participant).indexOf(row.name) < prop[rows[i].level][rows[i].award]) ++result
                  return result
                })
              }

              function getPatent(prop){
                if(!prop) prop={}
                const min_pos=prop.min_pos | 1
                return select('TablePatent',['participant'],`participant LIKE '%${row.name}%' AND date>${row.employed_from} AND date<${row.employed_til}`)
                .then(rows=>{
                  let result=0
                  for(let i =0;i<rows.length;++i)
                    if(JSON.parse(rows[i].participant).indexOf(row.name) < min_pos) ++result
                  return result
                })
              }

              function getBook(prop){
                if(!prop) prop={}
                const min_pos=prop.min_pos | 1
                return select('TableBook',['author'],`author LIKE '%${id}%' AND publish_at>${row.employed_from} AND publish_at<${row.employed_til}`)
                .then(rows=>{
                  let result=0
                  for(let i =0;i<rows.length;++i)
                    if(JSON.parse(rows[i].author).indexOf(id) < min_pos) ++result
                  return result
                })
              }

              function getResearchAward(prop){
                return select('TableResearchAward',['participant','level','award'],`participant LIKE '%${row.name}%'`)
                .then(rows=>{
                  let result=0
                  for(let i=0;i<rows.length;++i)
                    if(Object.keys(prop).includes(rows[i].level.toString()))
                      if(Object.keys(prop[rows[i].level]).includes(rows[i].award.toString()))
                        if(JSON.parse(rows[i].participant).indexOf(row.name) < prop[rows[i].level][rows[i].award]) ++result
                  return result
                })
              }

              function getStudentAward(prop){
                return select('TableStudentAward',[1],`teacher='${id}'`)
                .then(rows=>{
                  return rows.length
                })
              }
            })
          )
        }
        return Promise.all(result)
        .then(()=>{return wb})
      }
    }
  }

  function finalize(){
    res.status(200)
    return drop('TableLock')
  }

  function handleError(e){
    console.log(e)
    switch(e){
      case 0:
        return logger.info('key unmatch')
        .then(()=>{
          res.body='key not matched'
          res.status(401)
        })
        break
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
      case 10:
        return logger.info('elite course sheet missing information')
        .then(()=>{
          res.body='elite course sheet missing information'
          res.status(400)
        })
        break
      case 11:
        return logger.info('thesis award sheet missing information')
        .then(()=>{
          res.body='thesis award sheet missing information'
          res.status(400)
        })
        break
      case 12:
        return logger.info('teaching award sheet missing information')
        .then(()=>{
          res.body='teaching award sheet missing information'
          res.status(400)
        })
        break
      case 13:
        return logger.info('patent sheet missing information')
        .then(()=>{
          res.body='patent sheet missing information'
          res.status(400)
        })
        break
      case 14:
        return logger.info('student award sheet missing information')
        .then(()=>{
          res.body='student award sheet missing information'
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

  async function reply(){
    if(!res.statusCode) res.status(500)
    if(res.body)
      res.send(JSON.stringify(res.body))
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
