import { contextChoices, resolveContextRef, handoffPacket } from "./conversation.mjs";
import { createRelayClient } from "./relay-client.mjs";
import { auth } from "./auth.mjs?v=0.2.0";

// Authenticated persistent relay. No sender may impersonate another Firebase user or enrolled agent.
export function initConversationRoom({ getViewState, navigate }) {
  const $=id=>document.getElementById(id);
  const postForm=$("conversation-compose"),feed=$("conversation-messages"),
    field=$("conversation-text"),actor=$("conversation-name"),kind=$("conversation-kind"),
    refSelect=$("conversation-ref"),status=$("conversation-status"),
    roomLabel=$("conversation-room"),decisionPanel=$("conversation-decision"),
    copy=$("conversation-copy"),publish=$("conversation-publish");
  const api=createRelayClient();
  let activeUid=null,ready=false,relayError="Secure relay connection unavailable";
  let currentProject=null,replyTo=null,preferredRef=null,pending=null;
  const histories=new Map(),cursors=new Map(),loading=new Set();
  let timer=null,generation=0;
  function make(tag,cls,value) {
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(value!==undefined)el.textContent=value;
    return el;
  }
  function selectedRef() {
    const parts=refSelect.value.split("/");
    return parts.length===2&&parts[0]&&parts[1]?{projectId:parts[0],eventId:parts[1]}:null;
  }
  function messages() {return histories.get(getViewState().projectId)||[];}
  function accept(message) {
    const list=histories.get(message.projectId)||[];
    if(list.some(m=>m.id===message.id))return;
    list.push(message);list.sort((a,b)=>a.seq-b.seq);
    if(list.length>100)list.splice(0,list.length-100);
    histories.set(message.projectId,list);
    if(message.projectId===getViewState().projectId)renderFeed();
  }
  function reset() {
    generation++;
    histories.clear();cursors.clear();loading.clear();
    pending=null;replyTo=null;preferredRef=null;
    feed.replaceChildren();
    $("conversation-reply-target").textContent="";
    if(timer){clearInterval(timer);timer=null;}
  }
  async function connect() {
    const seen=generation;
    if(!activeUid)return;
    try {
      await api.health();
      if(seen!==generation)return;
      ready=true;relayError="";
      render();
      await poll();
    }catch(error) {
      if(seen!==generation)return;
      ready=false;
      relayError=error.message;
      render();
    }
  }
  function attachAccount(uid) {
    // Custom DOM events are untrusted; use only Firebase's actual current identity.
    if(uid!==(window.contextwiseCurrentUid||null))return;
    if(activeUid===uid)return;
    reset();activeUid=uid;ready=false;
    actor.value=auth.currentUser?.displayName||"Verified Firebase account";
    timer=uid?setInterval(()=>{if(ready)void poll();else void connect();},7000):null;
    render();
    if(uid)void connect();
  }
  async function poll() {
    if(!activeUid||!ready)return;
    const {projectId}=getViewState();
    if(loading.has(projectId))return;
    loading.add(projectId);
    const seen=generation;
    const after=cursors.has(projectId)?cursors.get(projectId):null;
    try {
      const result=await api.read(projectId,after);
      if(seen!==generation)return;
      for(const m of result.messages)accept(m);
      cursors.set(projectId,Math.max(after||0,result.cursor||0));
      if(result.more)void poll();
      relayError="";
    }catch(error) {
      if(seen===generation) {
        relayError=error.message;
        $("conversation-action-status").textContent="Relay read failed: "+relayError;
      }
    }finally {
      loading.delete(projectId);
      if(seen===generation)renderStatus();
    }
  }
  function displayDecision() {
    decisionPanel.replaceChildren();
    const ref=selectedRef();
    const found=ref&&resolveContextRef(getViewState().workspace,ref);
    if(!found) {
      decisionPanel.append(make("p","muted","Select a source-linked decision or event to discuss."));
      return;
    }
    decisionPanel.append(make("strong","",found.event.title));
    decisionPanel.append(make("span","conversation-small",
      `${found.project.title} · ${found.event.date} · ${found.event.type}`));
    decisionPanel.append(make("p","",found.event.summary));
    decisionPanel.append(make("span","conversation-small",found.event.sourceRefs.length?
      `${found.event.sourceRefs.length} source reference(s) attached. Check original evidence.`:
      "No source references: treat as unverified."));
    const go=make("button","secondary conversation-jump","Inspect this event");
    go.type="button";go.addEventListener("click",()=>navigate(found.project.id,found.event.id));
    decisionPanel.append(go);
  }
  async function inspectRemote(ref) {
    try {
      const result=await api.context(ref.projectId,ref.eventId);
      decisionPanel.replaceChildren();
      decisionPanel.append(make("strong","",result.event.title));
      decisionPanel.append(make("p","",result.event.summary));
      decisionPanel.append(make("span","conversation-small",
        `Owner-published · ${result.event.status} · ${result.event.date}`));
      for(const source of result.event.sourceRefs)decisionPanel.append(make("p","conversation-small",source));
      $("conversation-action-status").textContent="Published context displayed. Check original sources before acting.";
    }catch(error){$("conversation-action-status").textContent="Context unavailable: "+error.message;}
  }
  function renderFeed() {
    const {projectId,workspace}=getViewState();
    feed.replaceChildren();
    const visible=messages().filter(m=>m.projectId===projectId).slice(-60);
    if(!visible.length) {
      feed.append(make("p","conversation-empty",ready?
        "No messages loaded for this project room. Server messages are retained subject to retention policy.":
        "Messages will appear once the secure relay is connected."));
      return;
    }
    for(const m of visible) {
      const mine=m.actorId==="user_"+activeUid;
      const article=make("article","conversation-bubble"+(mine?" from-me":""));
      const top=make("div","conversation-bubble-head");
      top.append(make("strong","",m.actorLabel+" · verified sender"));
      top.append(make("span","conversation-small",
        `${m.kind.replaceAll("-"," ")} · ${new Date(m.createdAt).toLocaleString()} · #${m.seq}`));
      article.append(top);
      if(m.replyTo)article.append(make("span","conversation-small",`Reply to ${m.replyTo.slice(0,12)}`));
      article.append(make("p","",m.body));
      for(const ref of m.contextRefs) {
        const found=resolveContextRef(workspace,ref);
        const button=make("button","conversation-ref-pill",found?
          `Context: ${found.project.title} / ${found.event.title}`:
          `Retrieve published context: ${ref.projectId}/${ref.eventId}`);
        button.type="button";
        button.addEventListener("click",()=>{
          if(found)navigate(found.project.id,found.event.id);
          else void inspectRemote(ref);
        });
        article.append(button);
      }
      const reply=make("button","secondary conversation-reply","Reply");
      reply.type="button";
      reply.addEventListener("click",()=>{
        replyTo=m.id;
        $("conversation-reply-target").textContent=`Replying to ${m.actorLabel}: ${m.body.slice(0,80)}`;
        field.focus();
      });
      article.append(reply);feed.append(article);
    }
    feed.scrollTop=feed.scrollHeight;
  }
  function renderStatus() {
    const enabled=!!activeUid&&ready&&activeUid===window.contextwiseCurrentUid&&auth.currentUser?.uid===activeUid;
    postForm.querySelector("button[type=submit]").disabled=!enabled;
    field.disabled=!enabled;
    publish.disabled=!enabled||!selectedRef();
    status.textContent=enabled?
      "Authenticated remote room: messages persist, senders are verified, and context links are advisory. Only owner-enrolled agents can participate.":
      activeUid?
        "Secure relay unavailable: "+relayError+". No message will be sent until the backend is ready.":
        "Sign in with Google to use authenticated project rooms.";
  }
  function render() {
    const {workspace,projectId,eventId}=getViewState();
    if(!workspace?.projects?.some(p=>p.id===projectId))return;
    if(currentProject!==projectId) {
      currentProject=projectId;replyTo=null;preferredRef=null;
      $("conversation-reply-target").textContent="";
      if(ready)void poll();
    }
    roomLabel.textContent=workspace.projects.find(p=>p.id===projectId).title;
    const choices=contextChoices(workspace,projectId),current=refSelect.value;
    refSelect.replaceChildren();
    const none=make("option","","No decision attached");none.value="";refSelect.append(none);
    for(const option of choices) {
      const el=make("option","",`${option.projectTitle}: ${option.title} (${option.date})`);
      el.value=`${option.projectId}/${option.eventId}`;refSelect.append(el);
    }
    const focused=preferredRef||(eventId?`${projectId}/${eventId}`:"");
    refSelect.value=[focused,current].find(v=>v&&choices.some(c=>c.projectId+"/"+c.eventId===v))||"";
    displayDecision();renderStatus();renderFeed();
  }
  postForm.addEventListener("submit",async event=>{
    event.preventDefault();
    if(!activeUid||!ready||auth.currentUser?.uid!==activeUid)return;
    const {projectId}=getViewState();
    const input={id:crypto.randomUUID(),kind:kind.value,body:field.value.trim(),
      contextRefs:selectedRef()?[selectedRef()]:[],replyTo};
    const fingerprint=JSON.stringify({projectId,...input,id:null});
    if(pending?.fingerprint!==fingerprint)pending={input,fingerprint};
    postForm.querySelector("button[type=submit]").disabled=true;
    try {
      const message=await api.post(projectId,pending.input);
      accept(message);
      field.value="";replyTo=null;pending=null;
      $("conversation-reply-target").textContent="";
      $("conversation-action-status").textContent="Message accepted by the authenticated relay (#"+message.seq+").";
    }catch(error) {
      $("conversation-action-status").textContent="Message not confirmed. Retry keeps its idempotency ID: "+error.message;
    }finally{renderStatus();}
  });
  refSelect.addEventListener("change",()=>{preferredRef=refSelect.value;displayDecision();renderStatus();});
  publish.addEventListener("click",async()=>{
    const ref=selectedRef(),found=ref&&resolveContextRef(getViewState().workspace,ref);
    if(!found||!ready)return;
    if(!confirm("Publish this event's summary and source references to the encrypted relay for authorized agents?"))return;
    const event={...found.event,status:"recorded"};
    try{
      await api.publish(ref.projectId,ref.eventId,event);
      $("conversation-action-status").textContent="Decision context published to encrypted relay. Publication is not an approval of a proposed change.";
    }catch(error){$("conversation-action-status").textContent="Context publication failed: "+error.message;}
  });
  copy.addEventListener("click",async()=>{
    const {workspace,projectId}=getViewState();
    try {
      const packet=handoffPacket(workspace,projectId,selectedRef()?[selectedRef()]:[],messages());
      await navigator.clipboard.writeText(JSON.stringify(packet,null,2));
      $("conversation-action-status").textContent="Review the copied context packet before sharing it with another agent.";
    }catch{$("conversation-action-status").textContent="Copy unavailable; nothing was sent.";}
  });
  window.addEventListener("contextwise:auth",event=>attachAccount(event.detail?.uid||null));
  window.addEventListener("pagehide",()=>{if(timer)clearInterval(timer);});
  attachAccount(window.contextwiseCurrentUid||null);
  return {refresh:render,focusDecision(projectId,eventId){
    if(getViewState().projectId!==projectId)return;
    preferredRef=`${projectId}/${eventId}`;render();
    $("conversation-hub").scrollIntoView({behavior:"smooth",block:"start"});field.focus();
  }};
}