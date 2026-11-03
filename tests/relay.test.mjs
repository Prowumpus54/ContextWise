import test from "node:test";
import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const S=require("../functions/lib/security.js");
const {handle}=require("../functions/lib/relay.js");

class Store {
  constructor(){this.map=new Map();}
  collection(path){return new Collection(this,path);}
  async runTransaction(fn){const tx={
    get:ref=>ref.get(),set:(ref,value,opt)=>ref.set(value,opt),
    create:(ref,value)=>ref.create(value)
  };return fn(tx);}
}
class Collection {
  constructor(db,path){this.db=db;this.path=path;}
  doc(id){return new Ref(this.db,this.path+"/"+id);}
  orderBy(field,direction="asc"){return new Query(this.db,this.path,field,direction);}
}
class Ref {
  constructor(db,path){this.db=db;this.path=path;}
  collection(name){return new Collection(this.db,this.path+"/"+name);}
  async get(){const value=this.db.map.get(this.path);return {exists:value!==undefined,
    data:()=>structuredClone(value)};}
  async set(value,opt){this.db.map.set(this.path,opt?.merge?
    {...(this.db.map.get(this.path)||{}),...structuredClone(value)}:structuredClone(value));}
  async create(value){if(this.db.map.has(this.path))throw Error("already exists");
    this.db.map.set(this.path,structuredClone(value));}
  async update(value){if(!this.db.map.has(this.path))throw Error("missing");
    this.db.map.set(this.path,{...this.db.map.get(this.path),...structuredClone(value)});}
}
class Query {
  constructor(db,path,field,dir){Object.assign(this,{db,path,field,dir,after:null,max:50});}
  startAfter(n){this.after=n;return this;}
  limit(n){this.max=n;return this;}
  async get(){
    const rows=[...this.db.map.entries()].filter(([key])=>
      key.startsWith(this.path+"/")&&!key.slice(this.path.length+1).includes("/"));
    rows.sort((a,b)=>this.dir==="desc"?
      (b[1][this.field]>a[1][this.field]?1:-1):(a[1][this.field]>b[1][this.field]?1:-1));
    const docs=rows.filter(([,r])=>this.after===null||r[this.field]>this.after).slice(0,this.max)
      .map(([path,value])=>({id:path.split("/").at(-1),data:()=>structuredClone(value)}));
    return {docs,size:docs.length};
  }
}
const ownerUid="ownerFirebaseUID123";
const key=Buffer.alloc(32,5).toString("base64");
function setup() {
  const db=new Store();
  const env={db,key,ownerUid,verifyIdToken:async token=>{
    if(token==="owner")return {uid:ownerUid};
    if(token==="member")return {uid:"memberFirebaseUID123"};
    throw Error("expired session");
  }};
  async function call(method,path,payload,token="owner",origin){
    const headers={authorization:"Bearer "+token};
    if(origin)headers.origin=origin;
    const req={method,url:path,headers,body:payload,rawBody:Buffer.from(JSON.stringify(payload||{}))};
    const res={code:200,headers:{},status(v){this.code=v;return this;},
      set(k,v){this.headers[k]=v;return this;},json(data){this.data=data;return this;},
      end(){return this;}};
    await handle(req,res,env);
    return res;
  }
  return {db,env,call};
}
function msg(text="Does the T15 job follow the decision?",id="00000000-0000-4000-8000-000000000001") {
  return {id,body:text,kind:"question",replyTo:null,
    contextRefs:[{projectId:"buildwise",eventId:"owner-grants"}],
    actorId:"owner_fake",actorLabel:"I am the owner"};
}
test("AES-GCM payload is opaque on disk and bound to its project and ID",()=>{
  const k=S.keyBytes(key),sealed=S.seal(k,{body:"Sensitive decision"},"room/id");
  assert.equal(JSON.stringify(sealed).includes("Sensitive decision"),false);
  assert.deepEqual(S.open(k,sealed,"room/id"),{body:"Sensitive decision"});
  assert.throws(()=>S.open(k,sealed,"another/id"));
  assert.throws(()=>S.open(Buffer.alloc(32,6),sealed,"room/id"));
  assert.throws(()=>S.keyBytes("short"),/not configured/);
});
test("input contracts reject invalid messages, refs, signoffs and unsafe grants",()=>{
  assert.throws(()=>S.message({...msg(),kind:"approved"}));
  assert.throws(()=>S.message({...msg(),body:"x".repeat(1601)}));
  assert.throws(()=>S.message({...msg(),contextRefs:Array(4).fill({projectId:"x",eventId:"e"})}));
  assert.throws(()=>S.message({...msg(),contextRefs:[{projectId:"..",eventId:"e"}]}));
  assert.throws(()=>S.signoff({id:msg().id,workRef:"PR#1",outcome:"done",conflicts:"",
    decisionRefs:[]}));
  assert.throws(()=>S.allowedProjects(["*"]));
  assert.throws(()=>S.grantExpiry(10000));
});
test("Firebase UID is authoritative; message survives replay and is encrypted",async()=>{
  const {call,db}=setup();
  const first=await call("POST","/api/v1/projects/buildwise/messages",msg());
  assert.equal(first.code,201);
  assert.equal(first.data.message.actorId,"user_"+ownerUid);
  assert.equal(first.data.message.actorLabel,"Owner");
  assert.equal(first.data.message.seq,1);
  const second=await call("POST","/api/v1/projects/buildwise/messages",msg());
  assert.equal(second.code,201);
  assert.equal(second.data.message.seq,1);
  const changed=await call("POST","/api/v1/projects/buildwise/messages",msg("altered"));
  assert.equal(changed.code,409);
  const stored=db.map.get("rooms/buildwise/messages/"+msg().id);
  assert.equal(stored.body,undefined);
  assert.equal(JSON.stringify(stored).includes(msg().body),false);
  const read=await call("GET","/api/v1/projects/buildwise/messages");
  assert.equal(read.code,200);
  assert.equal(read.data.messages.length,1);
  assert.equal(read.data.messages[0].body,msg().body);
});
test("grant cannot post to another project or privileged context, and revocation is immediate",async()=>{
  const {call}=setup();
  const denied=await call("GET","/v1/projects/buildwise/messages",null,"member");
  assert.equal(denied.code,403);
  const created=await call("POST","/v1/grants/agents",{
    label:"Ken",projects:["buildwise"],operations:["post","read"],hours:2
  });
  assert.equal(created.code,201);
  assert.match(created.data.credential,/^cwagt_[a-f0-9]{32}\.[A-Za-z0-9_-]{43}$/);
  const cred=created.data.credential;
  const posted=await call("POST","/v1/projects/buildwise/messages",msg(),cred);
  assert.equal(posted.code,201);
  assert.equal(posted.data.message.actorLabel,"Ken");
  assert.match(posted.data.message.actorId,/^agent_/);
  assert.equal((await call("GET","/v1/projects/tasker/messages",null,cred)).code,403);
  assert.equal((await call("PUT","/v1/projects/buildwise/context/d1",{},cred)).code,403);
  assert.equal((await call("POST","/v1/grants/agents",{label:"Bad",projects:["buildwise"],operations:["post"],hours:2},cred)).code,403);
  assert.equal((await call("DELETE","/v1/grants/"+created.data.grantId)).code,200);
  assert.equal((await call("GET","/v1/projects/buildwise/messages",null,cred)).code,403);
});
test("user-specific grant, scope and expiration prevent unauthorized reads",async()=>{
  const {call,db}=setup();
  await call("POST","/v1/grants/users",{uid:"memberFirebaseUID123",label:"Beth",
    projects:["tasker"],operations:["read"],hours:1});
  assert.equal((await call("GET","/v1/projects/tasker/messages",null,"member")).code,200);
  assert.equal((await call("GET","/v1/projects/buildwise/messages",null,"member")).code,403);
  await db.collection("grants").doc("user_memberFirebaseUID123").update({expiresAtMs:Date.now()-1});
  assert.equal((await call("GET","/v1/projects/tasker/messages",null,"member")).code,403);
});
test("context is owner-published with references but never automatically approved",async()=>{
  const {call,db}=setup();
  const event={id:"d1",date:"2026-11-03",type:"decision",
    title:"Scoped authorization",summary:"Keep the private decision evidence private",
    status:"recorded",sourceRefs:["commit:12345"]};
  assert.equal((await call("PUT","/v1/projects/buildwise/context/d1",event)).code,200);
  assert.equal(JSON.stringify(db.map.get("contexts/buildwise/events/d1")).includes(event.summary),false);
  const found=await call("GET","/v1/projects/buildwise/context/d1");
  assert.equal(found.code,200);
  assert.equal(found.data.event.summary,event.summary);
  assert.equal(found.data.event.status,"recorded");
  const index=await call("GET","/v1/projects/buildwise/context");
  assert.equal(index.code,200);
  assert.equal(index.data.events.length,1);
  assert.equal(index.data.events[0].title,event.title);
  const signoff=await call("POST","/v1/projects/buildwise/signoffs",{
    id:"00000000-0000-4000-8000-000000000009",workRef:"PR #12",
    outcome:"Tests pass",conflicts:"Old decision differs",
    decisionRefs:[{projectId:"buildwise",eventId:"d1"}]});
  assert.equal(signoff.code,201);
  assert.equal(signoff.data.status,"recorded-unreviewed");
});
test("denies unknown origin, invalid auth and missing backend key",async()=>{
  const {call,env}=setup();
  assert.equal((await call("GET","/v1/health",null,"owner","https://evil.example")).code,403);
  assert.equal((await call("GET","/v1/projects/buildwise/messages",null,"expired")).code,401);
  env.key="";
  assert.equal((await call("GET","/v1/health")).code,503);
});
test("server refuses nonexistent reply target and accepts a valid one",async()=>{
  const {call}=setup();
  const bad=await call("POST","/v1/projects/buildwise/messages",
    {...msg(),replyTo:"00000000-0000-4000-8000-000000000007"});
  assert.equal(bad.code,400);
  assert.equal((await call("POST","/v1/projects/buildwise/messages",msg())).code,201);
  const good=await call("POST","/v1/projects/buildwise/messages",{
    ...msg("Follow-up","00000000-0000-4000-8000-000000000002"),replyTo:msg().id});
  assert.equal(good.code,201);
  assert.equal(good.data.message.seq,2);
});