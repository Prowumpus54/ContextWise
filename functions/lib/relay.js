"use strict";
const crypto=require("node:crypto");
const S=require("./security");
const ALLOWED_ORIGINS=new Set(["https://contextwise-4a846.web.app","https://contextwise-4a846.firebaseapp.com"]);
const ONE_DAY=86400000;
function send(res,status,data) {
  res.status(status).set("Cache-Control","no-store").set("X-Content-Type-Options","nosniff").json(data);
}
function body(req) {
  S.assert(req.rawBody?.length===undefined||req.rawBody.length<=16384,413,"Request too large");
  S.assert(req.body&&typeof req.body==="object"&&!Array.isArray(req.body),400,"Expected JSON object");
  return req.body;
}
async function authenticate(req,env) {
  const h=String(req.headers.authorization||"");
  S.assert(h.startsWith("Bearer ")&&h.length<6000,401,"Authentication required");
  const token=h.slice(7);
  if(token.startsWith("cwagt_")) {
    const match=/^cwagt_([a-f0-9]{32})\.([A-Za-z0-9_-]{43})$/.exec(token);
    S.assert(!!match,401,"Invalid agent credential");
    const snap=await env.db.collection("grants").doc("agent_"+match[1]).get();
    const grant=snap.exists?snap.data():null;
    S.assert(grant&&S.matchSecret(grant.secretHash,match[2])&&grant.revoked!==true &&
      grant.expiresAtMs>Date.now(),403,"Agent credential expired or revoked");
    return {id:"agent_"+match[1],label:grant.label,owner:false,grant};
  }
  let user;
  try {user=await env.verifyIdToken(token);}catch{throw new S.HttpError(401,"Invalid or revoked Firebase session");}
  S.assert(user?.uid,401,"Invalid session");
  if(user.uid===env.ownerUid) return {id:"user_"+user.uid,label:"Owner",owner:true};
  const snap=await env.db.collection("grants").doc("user_"+user.uid).get();
  const grant=snap.exists?snap.data():null;
  S.assert(grant&&grant.revoked!==true&&grant.expiresAtMs>Date.now(),
    403,"This account is not enrolled in the relay");
  return {id:"user_"+user.uid,label:grant.label||"Member",owner:false,grant};
}
function authorize(actor,projectId,operation) {
  S.assert(actor.owner||S.isGrantActive(actor.grant,projectId,operation),
    403,"Project or operation not granted");
}
async function audit(env,actor,action,scope) {
  await env.db.collection("audit").doc(crypto.randomUUID()).set({
    actor:actor.id,action,scope,at:new Date(),
    expiresAt:new Date(Date.now()+90*ONE_DAY)
  });
}
async function limit(env,actor,limit=30) {
  const minute=Math.floor(Date.now()/60000);
  const ref=env.db.collection("limits").doc(S.sha(actor.id+"|"+minute));
  await env.db.runTransaction(async tx=>{
    const snap=await tx.get(ref);
    const count=snap.exists?snap.data().count:0;
    S.assert(count<limit,429,"Posting rate limit exceeded");
    tx.set(ref,{count:count+1,expiresAt:new Date(Date.now()+2*ONE_DAY)});
  });
}
function wireMessage(projectId,doc,key) {
  const value=S.open(key,doc,projectId+"/"+doc.id);
  return {schemaVersion:1,id:doc.id,projectId,actorId:doc.actor,
    actorLabel:value.label,kind:value.kind,body:value.body,createdAt:doc.createdAt,
    contextRefs:value.contextRefs,replyTo:value.replyTo,seq:doc.seq,
    senderVerification:"server-authenticated",decisionAuthority:"unreviewed-chat"};
}
async function listMessages(req,res,env,actor,projectId,key) {
  const url=new URL(req.url,"https://relay.local");
  const raw=url.searchParams.get("after");
  const after=raw===null?null:Number(raw);
  S.assert(raw===null||(Number.isSafeInteger(after)&&after>=0),400,"Invalid cursor");
  const ref=env.db.collection("rooms").doc(projectId).collection("messages");
  const query=raw===null?ref.orderBy("seq","desc").limit(50):
    ref.orderBy("seq").startAfter(after).limit(50);
  const snap=await query.get();
  const docs=raw===null?[...snap.docs].reverse():snap.docs;
  const result=docs.map(d=>wireMessage(projectId,d.data(),key));
  const cursor=result.length?result[result.length-1].seq:(after||0);
  send(res,200,{messages:result,cursor,more:raw!==null&&snap.size===50});
}
async function postMessage(req,res,env,actor,projectId,key) {
  const m=S.message(body(req));
  await limit(env,actor);
  const room=env.db.collection("rooms").doc(projectId);
  const ref=room.collection("messages").doc(m.id);
  const hash=S.sha(JSON.stringify(m));
  const createdAt=new Date().toISOString();
  const packed=S.seal(key,{label:actor.label,kind:m.kind,body:m.body,
    contextRefs:m.contextRefs,replyTo:m.replyTo},projectId+"/"+m.id);
  const result=await env.db.runTransaction(async tx=>{
    const existing=await tx.get(ref);
    if(existing.exists) {
      const old=existing.data();
      S.assert(old.actor===actor.id&&old.bodyHash===hash,409,"Conflicting idempotency ID");
      return old;
    }
    if(m.replyTo){
      const parent=await tx.get(room.collection("messages").doc(m.replyTo));
      S.assert(parent.exists,400,"Reply target is not in this project room");
    }
    const roomSnap=await tx.get(room);
    const seq=(roomSnap.exists?roomSnap.data().lastSeq||0:0)+1;
    S.assert(Number.isSafeInteger(seq),503,"Room sequence exhausted");
    const record={id:m.id,actor:actor.id,seq,createdAt,bodyHash:hash,...packed,
      expiresAt:new Date(Date.now()+30*ONE_DAY)};
    tx.set(room,{lastSeq:seq,updatedAt:new Date()},{merge:true});
    tx.create(ref,record);
    return record;
  });
  await audit(env,actor,"message-post",projectId);
  send(res,201,{message:wireMessage(projectId,result,key),cursor:result.seq});
}
async function listContext(req,res,env,actor,projectId,key) {
  const snap=await env.db.collection("contexts").doc(projectId)
    .collection("events").orderBy("publishedAt","desc").limit(50).get();
  const events=snap.docs.map(doc=>{
    const record=doc.data();
    return {...S.open(key,record,projectId+"/"+doc.id),
      projectId,publisher:record.publisher,publishedAt:record.publishedAt};
  });
  send(res,200,{projectId,events,hasMore:snap.size===50});
}
async function getContext(req,res,env,actor,projectId,eventId,key) {
  const ref=env.db.collection("contexts").doc(projectId).collection("events").doc(eventId);
  const snap=await ref.get();
  S.assert(snap.exists,404,"Context event has not been published");
  const record=snap.data();
  send(res,200,{event:S.open(key,record,projectId+"/"+eventId),
    publisher:record.publisher,publishedAt:record.publishedAt});
}
async function putContext(req,res,env,actor,projectId,eventId,key) {
  S.assert(actor.owner,403,"Only the owner may publish an archive event");
  const event=S.contextEvent(body(req),eventId);
  const ref=env.db.collection("contexts").doc(projectId).collection("events").doc(eventId);
  await ref.set({...S.seal(key,event,projectId+"/"+eventId),
    publisher:actor.id,publishedAt:new Date().toISOString()});
  await audit(env,actor,"context-published",projectId+"/"+eventId);
  send(res,200,{published:true,projectId,eventId,status:event.status});
}
async function postSignoff(req,res,env,actor,projectId,key) {
  const input=S.signoff(body(req));
  await limit(env,actor);
  const ref=env.db.collection("rooms").doc(projectId).collection("signoffs").doc(input.id);
  const hash=S.sha(JSON.stringify(input));
  const old=await ref.get();
  if(old.exists) {
    S.assert(old.data().actor===actor.id&&old.data().bodyHash===hash,409,"Conflicting signoff ID");
    return send(res,200,{id:input.id,status:"recorded-unreviewed"});
  }
  await ref.create({...S.seal(key,input,projectId+"/"+input.id),
    actor:actor.id,bodyHash:hash,createdAt:new Date().toISOString(),
    expiresAt:new Date(Date.now()+90*ONE_DAY),status:"recorded-unreviewed"});
  await audit(env,actor,"signoff-created",projectId);
  send(res,201,{id:input.id,status:"recorded-unreviewed"});
}
async function grant(req,res,env,actor,mode) {
  S.assert(actor.owner,403,"Only the owner can enroll participants");
  const input=body(req);
  const projects=S.allowedProjects(input.projects);
  const operations=S.allowedOps(input.operations);
  const expiresAtMs=S.grantExpiry(input.hours);
  S.assert(S.text(input.label,40),400,"Invalid participant name");
  if(mode==="users") {
    S.assert(typeof input.uid==="string"&&/^[A-Za-z0-9_-]{10,128}$/.test(input.uid),400,"Invalid Firebase UID");
    S.assert(input.uid!==env.ownerUid,400,"Owner already has access");
    const id="user_"+input.uid;
    await env.db.collection("grants").doc(id).set({
      label:input.label,projects,operations,expiresAtMs,revoked:false,type:"user"
    });
    await audit(env,actor,"grant-user",id);
    return send(res,201,{grantId:id,expiresAt:new Date(expiresAtMs).toISOString()});
  }
  const id=crypto.randomBytes(16).toString("hex");
  const secret=crypto.randomBytes(32).toString("base64url");
  await env.db.collection("grants").doc("agent_"+id).create({
    label:input.label,projects,operations,expiresAtMs,revoked:false,type:"agent",
    secretHash:S.sha(secret)
  });
  await audit(env,actor,"grant-agent","agent_"+id);
  // Credential is returned once and MUST be stored in VaultWise, not browser localStorage.
  send(res,201,{grantId:"agent_"+id,credential:"cwagt_"+id+"."+secret,
    expiresAt:new Date(expiresAtMs).toISOString()});
}
async function revoke(res,env,actor,grantId) {
  S.assert(actor.owner,403,"Only the owner can revoke grants");
  S.assert(/^agent_[0-9a-f]{32}$/.test(grantId)||/^user_[A-Za-z0-9_-]{10,128}$/.test(grantId),400,"Invalid grant ID");
  const ref=env.db.collection("grants").doc(grantId);
  const doc=await ref.get();
  S.assert(doc.exists,404,"Grant not found");
  await ref.update({revoked:true,revokedAt:new Date().toISOString()});
  await audit(env,actor,"grant-revoked",grantId);
  send(res,200,{revoked:true,grantId});
}
async function handle(req,res,env) {
  res.set("Cache-Control","no-store");
  res.set("X-Content-Type-Options","nosniff");
  res.set("Referrer-Policy","no-referrer");
  const origin=req.headers.origin;
  if(origin) {
    if(!ALLOWED_ORIGINS.has(origin)) return send(res,403,{error:"Origin not allowed"});
    res.set("Access-Control-Allow-Origin",origin);
    res.set("Vary","Origin");
    res.set("Access-Control-Allow-Headers","Authorization, Content-Type");
    res.set("Access-Control-Allow-Methods","GET, POST, PUT, DELETE, OPTIONS");
  }
  if(req.method==="OPTIONS")return res.status(204).end();
  try {
    const key=S.keyBytes(env.key);
    S.assert(typeof env.ownerUid==="string"&&env.ownerUid.length>=10,503,"Relay owner not configured");
    let path=new URL(req.url,"https://relay.local").pathname;
    path=path.replace(/^\/api(?=\/)/,"").replace(/^\/relay(?=\/)/,"");
    if(path==="/v1/health"&&req.method==="GET")return send(res,200,{status:"ready",version:"1"});
    const actor=await authenticate(req,env);
    const messages=/^\/v1\/projects\/([A-Za-z0-9_-]{1,64})\/messages$/.exec(path);
    if(messages) {
      const projectId=messages[1];
      S.assert(S.id(projectId),404,"Invalid room");
      if(req.method==="GET"){authorize(actor,projectId,"read");return await listMessages(req,res,env,actor,projectId,key);}
      if(req.method==="POST"){authorize(actor,projectId,"post");return await postMessage(req,res,env,actor,projectId,key);}
    }
    const contextList=/^\/v1\/projects\/([A-Za-z0-9_-]{1,64})\/context$/.exec(path);
    if(contextList&&req.method==="GET") {
      const p=contextList[1];authorize(actor,p,"context");
      return await listContext(req,res,env,actor,p,key);
    }
    const context=/^\/v1\/projects\/([A-Za-z0-9_-]{1,64})\/context\/([A-Za-z0-9_-]{1,64})$/.exec(path);
    if(context) {
      const [_,p,e]=context;
      S.assert(S.id(p)&&S.id(e),404,"Invalid context event");
      if(req.method==="GET"){authorize(actor,p,"context");return await getContext(req,res,env,actor,p,e,key);}
      if(req.method==="PUT")return await putContext(req,res,env,actor,p,e,key);
    }
    const signoffs=/^\/v1\/projects\/([A-Za-z0-9_-]{1,64})\/signoffs$/.exec(path);
    if(signoffs&&req.method==="POST") {
      const p=signoffs[1];authorize(actor,p,"signoff");
      return await postSignoff(req,res,env,actor,p,key);
    }
    const enrollment=/^\/v1\/grants\/(agents|users)$/.exec(path);
    if(enrollment&&req.method==="POST")return await grant(req,res,env,actor,enrollment[1]);
    const revocation=/^\/v1\/grants\/(agent_[0-9a-f]{32}|user_[A-Za-z0-9_-]{10,128})$/.exec(path);
    if(revocation&&req.method==="DELETE")return await revoke(res,env,actor,revocation[1]);
    throw new S.HttpError(404,"Unknown relay endpoint");
  } catch(error) {
    const status=error instanceof S.HttpError?error.status:500;
    if(status===500)console.error("ContextWise relay request failed",error?.name||"Error");
    return send(res,status,{error:status===500?"Relay unavailable":error.message});
  }
}
module.exports={handle,authenticate,authorize};