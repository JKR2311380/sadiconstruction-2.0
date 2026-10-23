const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Yushin/AppData/Local/Temp/sadicon-qa-playwright/node_modules/playwright');
const root = __dirname;
const q = { results: fs.existsSync(path.join(root,'results.json')) ? JSON.parse(fs.readFileSync(path.join(root,'results.json'),'utf8')) : [], errors: fs.existsSync(path.join(root,'browser-errors.json')) ? JSON.parse(fs.readFileSync(path.join(root,'browser-errors.json'),'utf8')) : [], root };
process.on('unhandledRejection',error=>{q.errors.push({context:'qa-harness',type:'unhandled',message:String(error)});q.flush?.();});
(async () => {
 q.browser = await chromium.launch({ headless: true, executablePath: 'C:/Users/Yushin/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe' });
 q.context = async (name,base,viewport={width:1440,height:1000}) => {
  const c = await q.browser.newContext({viewport,acceptDownloads:true});
  await c.tracing.start({screenshots:true,snapshots:true,sources:false});
  const p = await c.newPage(); p.setDefaultTimeout(12000); p.setDefaultNavigationTimeout(30000);
  p.on('pageerror',e=>q.errors.push({context:name,type:'pageerror',message:e.message}));
  p.on('console',m=>{if(m.type()==='error')q.errors.push({context:name,type:'console',message:m.text()});});
  p.on('response',async r=>{if(r.status()>=400)q.errors.push({context:name,type:'http',status:r.status(),url:r.url().split('?')[0],body:(await r.text().catch(()=>'' )).slice(0,600)});});
  p.on('requestfailed',r=>q.errors.push({context:name,type:'network',url:r.url().split('?')[0],message:r.failure()?.errorText}));
  q[name]={c,p,base}; return q[name];
 };
 q.snap = async (p,name)=> {await p.screenshot({path:path.join(root,'evidence',name+'.png'),fullPage:true}); return 'evidence/'+name+'.png';};
 q.record = (id,status,details) => {const row={id,status,details};q.results.push(row);fs.writeFileSync(path.join(root,'results.json'),JSON.stringify(q.results,null,2));q.flush?.();return row;};
 q.assert = (condition,message) => {if(!condition)throw Error(message);};
 q.test = async (id,fn)=>{try{q.record(id,'PASS',await fn());}catch(e){q.record(id,'FAIL',e.message);}};
 q.flush = ()=>fs.writeFileSync(path.join(root,'browser-errors.json'),JSON.stringify(q.errors,null,2));
 http.createServer(async(req,res)=>{let body='';for await(const chunk of req)body+=chunk;try{const code=JSON.parse(body).code;const value=await new (Object.getPrototypeOf(async function(){}).constructor)('q','require',code)(q,require);q.flush();res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:true,value}));}catch(e){q.flush();res.setHeader('content-type','application/json');res.end(JSON.stringify({ok:false,error:e.stack}));}}).listen(5190,'127.0.0.1',()=>console.log('QA browser driver on 5190'));
})();
