// Explicitly authenticated HTTPS transport. Never store Firebase or agent tokens.
import { auth } from "./auth.mjs?v=0.2.0";
const BASE="/api/v1";
export function validateRelayEnvelope(value) {
  const id=/^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$/;
  if(!value||value.schemaVersion!==1||!id.test(value.id)||!id.test(value.projectId)||
     !id.test(value.actorId)||typeof value.actorLabel!=="string"||value.actorLabel.length>40||
     !["question","proposal","work-update","evidence"].includes(value.kind)||
     typeof value.body!=="string"||value.body.length>1600||
     !Number.isSafeInteger(value.seq)||value.seq<1||
     value.senderVerification!=="server-authenticated"||
     !Array.isArray(value.contextRefs)||value.contextRefs.length>3 ||
     !value.contextRefs.every(r=>id.test(r.projectId)&&id.test(r.eventId)))
    throw new Error("Invalid relay response");
  return value;
}
export function createRelayClient() {
  async function request(path,method="GET",value) {
    const user=auth.currentUser;
    if(!user)throw new Error("Sign in required");
    const token=await user.getIdToken();
    const response=await fetch(BASE+path,{
      method,
      headers:{"Authorization":"Bearer "+token,
        ...(value!==undefined?{"Content-Type":"application/json"}:{})},
      ...(value!==undefined?{body:JSON.stringify(value)}:{}),
      cache:"no-store",credentials:"omit"
    });
    let payload;
    try {payload=await response.json();}catch{throw new Error("Secure relay backend is not deployed or reachable");}
    if(!response.ok)throw new Error(String(payload.error||"Relay request failed").slice(0,140));
    return payload;
  }
  return {
    health:async()=>{const response=await fetch(BASE+"/health",{cache:"no-store"});
      if(!response.ok)throw new Error("Relay unavailable");const data=await response.json();
      if(data.status!=="ready")throw new Error("Relay not configured");
      return data;},
    read:async(projectId,after)=>{const result=await request("/projects/"+encodeURIComponent(projectId)+
      "/messages"+(after===null?"":"?after="+after));
      return {...result,messages:result.messages.map(validateRelayEnvelope)};},
    post:async(projectId,message)=>{const result=await request("/projects/"+encodeURIComponent(projectId)+"/messages","POST",message);
      return validateRelayEnvelope(result.message);},
    tree:async(projectId)=>request("/projects/"+encodeURIComponent(projectId)+"/context"),
    context:async(projectId,eventId)=>request("/projects/"+encodeURIComponent(projectId)+"/context/"+encodeURIComponent(eventId)),
    publish:async(projectId,eventId,event)=>request("/projects/"+encodeURIComponent(projectId)+"/context/"+encodeURIComponent(eventId),"PUT",event)
  };
}