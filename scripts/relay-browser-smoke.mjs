import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const repo=resolve(import.meta.dirname,"..");
const profile=mkdtempSync(join(tmpdir(),"cw-relay-cdp-"));
const edge="C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const port=9242,webport=4183;
const web=spawn(process.execPath,["scripts/dev.mjs"],{
  cwd:repo,env:{...process.env,PORT:String(webport)},stdio:"ignore"
});
const chrome=spawn(edge,["--headless=new","--disable-gpu","--no-first-run",
  "--remote-debugging-port="+port,"--remote-allow-origins=*",
  "--user-data-dir="+profile,"about:blank"],{stdio:"ignore"});
const base="http://127.0.0.1:"+port;
async function api(path,method="GET"){
  const response=await fetch(base+path,{method});
  if(!response.ok)throw new Error("CDP HTTP "+response.status);
  return response.json();
}
class Tab {
  constructor(url) {
    this.socket=new WebSocket(url);this.n=0;this.pending=new Map();
    this.open=new Promise((resolve,reject)=>{this.socket.onopen=resolve;this.socket.onerror=reject;});
    this.socket.onmessage=e=>{
      const m=JSON.parse(e.data);
      if(this.pending.has(m.id)) {
        const item=this.pending.get(m.id);this.pending.delete(m.id);
        m.error?item.reject(new Error(m.error.message)):item.resolve(m.result);
      }
    };
  }
  async cmd(method,params={}) {
    await this.open;
    const id=++this.n;
    const promise=new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));
    this.socket.send(JSON.stringify({id,method,params}));return promise;
  }
  async js(expression){
    const result=await this.cmd("Runtime.evaluate",{expression,returnByValue:true,awaitPromise:true});
    if(result.exceptionDetails)throw Error(result.exceptionDetails.text);
    return result.result.value;
  }
  close(){this.socket.close();}
}
async function until(fn,attempts=50) {
  for(let i=0;i<attempts;i++){
    try{if(await fn())return true;}catch{}
    await delay(200);
  }
  return false;
}
let tab;
try {
  if(!await until(async()=>(await fetch("http://127.0.0.1:"+webport)).ok))
    throw Error("local site server did not start");
  if(!await until(async()=>!!(await api("/json/version")).Browser))
    throw Error("Edge CDP did not start");
  const target=await api("/json/new?"+encodeURIComponent(
    "http://127.0.0.1:"+webport+"/?release=020-relay-smoke"),"PUT");
  tab=new Tab(target.webSocketDebuggerUrl);
  if(!await until(()=>tab.js("document.querySelector('#project-select')?.value === 'aurora'"),100)) {
    console.log("SMOKE_DIAG "+JSON.stringify(await tab.js("({readyState:document.readyState,project:document.querySelector('#project-select')?.value,options:document.querySelector('#project-select')?.options.length,boot:window.contextwiseBoot,auth:window.contextwiseAuthDiagnostics,body:document.body.innerText.slice(0,250)})")));
    throw Error("website modules did not initialize");
  }
  const baseline=await tab.js("({version:document.querySelector('#footer-version')?.textContent,disabled:document.querySelector('#conversation-text').disabled,status:document.querySelector('#conversation-status').textContent})");
  if(baseline.version!=="v0.2.0"||baseline.disabled!==true)
    throw Error("unauthenticated relay UI did not fail closed");
  await tab.js("window.dispatchEvent(new CustomEvent('contextwise:auth',{detail:{uid:'spoofed'}}));true");
  await delay(1200);
  const spoof=await tab.js("({disabled:document.querySelector('#conversation-text').disabled,status:document.querySelector('#conversation-status').textContent})");
  console.log("SPOOF_DIAG "+JSON.stringify(spoof));
  if(spoof.disabled!==true||!spoof.status.includes("Sign in with Google"))
    throw Error("relay UI allowed posting after spoofed browser identity event");
  console.log(JSON.stringify({result:"PASS",unauthenticatedDisabled:baseline.disabled,
    spoofedAuthDisabled:spoof.disabled,siteVersion:baseline.version,
    backendStatus:spoof.status}));
} catch(e) {console.error("RELAY_SMOKE_FAIL "+e.message);process.exitCode=1;}
finally {tab?.close();chrome.kill();web.kill();await delay(300);
  try{rmSync(profile,{recursive:true,force:true});}catch{}}