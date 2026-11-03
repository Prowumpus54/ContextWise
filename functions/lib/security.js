"use strict";
const crypto = require("node:crypto");
const ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KINDS = new Set(["question","proposal","work-update","evidence"]);
const OPERATIONS = new Set(["read","post","context","signoff"]);
class HttpError extends Error {
  constructor(status, message) { super(message); this.status=status; }
}
function assert(condition, status, message) {
  if (!condition) throw new HttpError(status,message);
}
function id(value) { return typeof value==="string" && ID.test(value); }
function text(value, max) {
  return typeof value==="string" && value.trim().length>0 && value.length<=max &&
    !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value);
}
function refs(value) {
  assert(Array.isArray(value) && value.length<=3,400,"Invalid decision references");
  const seen=new Set();
  return value.map(ref=>{
    assert(id(ref?.projectId)&&id(ref?.eventId),400,"Invalid decision reference");
    const key=ref.projectId+"/"+ref.eventId;
    assert(!seen.has(key),400,"Duplicate decision reference");
    seen.add(key);
    return {projectId:ref.projectId,eventId:ref.eventId};
  });
}
function message(value) {
  assert(value && typeof value==="object" && !Array.isArray(value),400,"Invalid message");
  assert(UUID.test(value.id||""),400,"Invalid idempotency ID");
  assert(KINDS.has(value.kind),400,"Invalid message intent");
  assert(text(value.body,1600),400,"Invalid message body");
  assert(value.replyTo==null || UUID.test(value.replyTo),400,"Invalid reply ID");
  return {id:value.id,kind:value.kind,body:value.body.trim(),
    replyTo:value.replyTo||null,contextRefs:refs(value.contextRefs||[])};
}
function contextEvent(value, eventId) {
  assert(value && typeof value==="object" && !Array.isArray(value),400,"Invalid context event");
  assert(id(eventId) && value.id===eventId,400,"Invalid context event ID");
  assert(["decision","milestone","blocker","note"].includes(value.type),400,"Invalid event type");
  assert(/^\d{4}-\d{2}-\d{2}$/.test(value.date||"") &&
    !Number.isNaN(Date.parse(value.date+"T00:00:00.000Z")) &&
    new Date(value.date+"T00:00:00.000Z").toISOString().slice(0,10)===value.date,
    400,"Invalid date");
  assert(text(value.title,160)&&text(value.summary,4000),400,"Invalid context text");
  assert(Array.isArray(value.sourceRefs)&&value.sourceRefs.length<=12&&
    value.sourceRefs.every(s=>typeof s==="string"&&s.length<=400),400,"Invalid source references");
  assert(["recorded","proposed","disputed","superseded","rejected"].includes(value.status),400,"Invalid authority status");
  return {id:eventId,type:value.type,date:value.date,title:value.title,
    summary:value.summary,sourceRefs:value.sourceRefs,status:value.status};
}
function signoff(value) {
  assert(value&&typeof value==="object"&&!Array.isArray(value),400,"Invalid signoff");
  assert(UUID.test(value.id||""),400,"Invalid signoff ID");
  assert(text(value.workRef,300),400,"Work evidence is required");
  assert(text(value.outcome,1000),400,"Outcome is required");
  assert(typeof value.conflicts==="string"&&value.conflicts.length<=1000,400,"Invalid conflict note");
  assert(Array.isArray(value.decisionRefs)&&value.decisionRefs.length>0,400,"Signoff needs decision references");
  return {id:value.id,workRef:value.workRef,outcome:value.outcome,conflicts:value.conflicts,
    decisionRefs:refs(value.decisionRefs)};
}
function keyBytes(secret) {
  assert(typeof secret==="string",503,"Relay encryption is not configured");
  const key=/^[0-9a-f]{64}$/i.test(secret)?Buffer.from(secret,"hex"):
    /^[A-Za-z0-9+/]{43}=$/.test(secret)?Buffer.from(secret,"base64"):Buffer.alloc(0);
  assert(key.length===32,503,"Relay encryption is not configured");
  return key;
}
function seal(key,value,aad) {
  const iv=crypto.randomBytes(12);
  const cipher=crypto.createCipheriv("aes-256-gcm",key,iv);
  cipher.setAAD(Buffer.from(aad));
  const encrypted=Buffer.concat([cipher.update(JSON.stringify(value),"utf8"),cipher.final()]);
  return {iv:iv.toString("base64"),ciphertext:encrypted.toString("base64"),tag:cipher.getAuthTag().toString("base64")};
}
function open(key,packed,aad) {
  const decipher=crypto.createDecipheriv("aes-256-gcm",key,Buffer.from(packed.iv,"base64"));
  decipher.setAAD(Buffer.from(aad));
  decipher.setAuthTag(Buffer.from(packed.tag,"base64"));
  return JSON.parse(Buffer.concat([decipher.update(Buffer.from(packed.ciphertext,"base64")),decipher.final()]).toString("utf8"));
}
const sha=value=>crypto.createHash("sha256").update(value).digest("hex");
function isGrantActive(grant,projectId,operation,now=Date.now()) {
  return !!grant && grant.revoked!==true && Number.isSafeInteger(grant.expiresAtMs) &&
    grant.expiresAtMs>now && Array.isArray(grant.projects) &&
    (grant.projects.includes(projectId)||grant.projects.includes("*")) &&
    Array.isArray(grant.operations)&&grant.operations.includes(operation);
}
function allowedOps(input) {
  assert(Array.isArray(input)&&input.length>0&&input.length<=4,400,"Invalid grant operations");
  const ops=[...new Set(input)];
  assert(ops.every(op=>OPERATIONS.has(op)),400,"Invalid grant operation");
  return ops;
}
function allowedProjects(input) {
  assert(Array.isArray(input)&&input.length>0&&input.length<=20,400,"Invalid grant projects");
  const projects=[...new Set(input)];
  assert(projects.every(id),400,"Invalid grant project");
  return projects;
}
function grantExpiry(hours) {
  assert(Number.isInteger(hours)&&hours>=1&&hours<=168,400,"Grant lifetime must be 1-168 hours");
  return Date.now()+hours*3600000;
}
function matchSecret(savedHash,secret) {
  if(typeof savedHash!=="string"||!/^[0-9a-f]{64}$/.test(savedHash)||
     typeof secret!=="string"||! /^[A-Za-z0-9_-]{43}$/.test(secret)) return false;
  return crypto.timingSafeEqual(Buffer.from(savedHash,"hex"),Buffer.from(sha(secret),"hex"));
}
module.exports={HttpError,assert,id,text,message,contextEvent,signoff,keyBytes,seal,open,sha,
  isGrantActive,allowedOps,allowedProjects,grantExpiry,matchSecret};