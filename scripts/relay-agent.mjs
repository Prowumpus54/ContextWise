// Agent adapter for explicit ContextWise relay API calls. Never auto-execute chat content.
import { randomUUID } from "node:crypto";
const endpoint=(process.env.CONTEXTWISE_RELAY_URL||
  "https://contextwise-4a846.web.app/api/v1").replace(/\/$/,"");
const credential=process.env.CONTEXTWISE_RELAY_AGENT_TOKEN;
const [action,project,...args]=process.argv.slice(2);
const safe=/^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;
if(!credential?.startsWith("cwagt_")) {
  console.error("Set CONTEXTWISE_RELAY_AGENT_TOKEN using your approved secret store.");
  process.exit(2);
}
if(!safe.test(project||"")) {
  console.error("Usage: node scripts/relay-agent.mjs read|watch|post|context|signoff <project> [...]");
  process.exit(2);
}
async function call(path,method="GET",data) {
  const response=await fetch(endpoint+path,{
    method,headers:{Authorization:"Bearer "+credential,
      ...(data?{"Content-Type":"application/json"}:{})},
    ...(data?{body:JSON.stringify(data)}:{}),cache:"no-store"
  });
  let body;
  try{body=await response.json();}catch{throw Error("Relay did not return JSON");}
  if(!response.ok)throw Error("Relay "+response.status+": "+String(body.error||"failed"));
  return body;
}
function decisionRef(s) {
  const parts=(s||"").split("/");
  if(parts.length!==2||!parts.every(p=>safe.test(p)))throw Error("Reference must be projectId/eventId");
  return {projectId:parts[0],eventId:parts[1]};
}
async function read(cursor) {
  return call("/projects/"+project+"/messages"+(cursor===null?"":"?after="+cursor));
}
async function run() {
  switch(action) {
    case "read": {
      const cursor=args.length?Number(args[0]):null;
      if(cursor!==null&&(!Number.isSafeInteger(cursor)||cursor<0))throw Error("Invalid cursor");
      console.log(JSON.stringify(await read(cursor),null,2));break;
    }
    case "watch": {
      let cursor=args.length?Number(args[0]):null;
      if(cursor!==null&&(!Number.isSafeInteger(cursor)||cursor<0))throw Error("Invalid cursor");
      while(true) {
        const result=await read(cursor);
        for(const m of result.messages)console.log(JSON.stringify(m));
        cursor=result.cursor;
        await new Promise(resolve=>setTimeout(resolve,7000));
      }
    }
    case "post": {
      const [kind,body,ref,id]=args;
      if(!kind||!body)throw Error("Usage: post <project> <kind> <body> [project/event] [idempotency-uuid]");
      const result=await call("/projects/"+project+"/messages","POST",{
        id:id||randomUUID(),kind,body,replyTo:null,contextRefs:ref?[decisionRef(ref)]:[]
      });
      console.log(JSON.stringify(result,null,2));break;
    }
    case "tree": {console.log(JSON.stringify(await call("/projects/"+project+"/context"),null,2));break;}
    case "context": {
      const eventId=args[0];
      if(!safe.test(eventId||""))throw Error("Usage: context <project> <eventId>");
      console.log(JSON.stringify(await call("/projects/"+project+"/context/"+eventId),null,2));break;
    }
    case "signoff": {
      const [workRef,outcome,ref,conflicts=""]=args;
      if(!ref)throw Error("Usage: signoff <project> <workRef> <outcome> <project/event> [conflicts]");
      const result=await call("/projects/"+project+"/signoffs","POST",{
        id:randomUUID(),workRef,outcome,conflicts,decisionRefs:[decisionRef(ref)]
      });
      console.log(JSON.stringify(result,null,2));break;
    }
    default:throw Error("Use read, watch, post, context or signoff");
  }
}
run().catch(e=>{console.error(e.message);process.exitCode=1;});