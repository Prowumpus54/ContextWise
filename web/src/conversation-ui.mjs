import { contextChoices, resolveContextRef, validateRoomMessage, handoffPacket } from "./conversation.mjs";

// In-browser same-account tab messaging only. No external ChatGPT agent, server, archive writer or persistent queue.
export function initConversationRoom({ getViewState, navigate }) {
  const $ = id => document.getElementById(id);
  const postForm=$("conversation-compose");
  const feed=$("conversation-messages");
  const field=$("conversation-text");
  const actor=$("conversation-name");
  const kind=$("conversation-kind");
  const refSelect=$("conversation-ref");
  const status=$("conversation-status");
  const roomLabel=$("conversation-room");
  const decisionPanel=$("conversation-decision");
  const copy=$("conversation-copy");
  const selfId="tab-"+crypto.randomUUID();
  let channel=null;
  let activeUid=null;
  let currentProject=null;
  let replyTo=null;
  let preferredRef=null;
  const seen=new Set();
  let messages=[];

  function make(tag,cls,value) {
    const el=document.createElement(tag);
    if(cls)el.className=cls;
    if(value!==undefined)el.textContent=value;
    return el;
  }
  function clearSession() {
    channel?.close();
    channel=null;
    messages=[];
    seen.clear();
    replyTo=null;
    preferredRef=null;
    feed.replaceChildren();
  }
  function attachAccount(uid) {
    if(uid===activeUid)return;
    clearSession();
    activeUid=uid;
    if(uid && typeof BroadcastChannel === "function") {
      // Same-origin tabs with the same Firebase account. This is NOT an authenticated remote agent relay.
      channel=new BroadcastChannel("contextwise-local-chat-preview:"+uid);
      channel.onmessage=event=>{
        if(!activeUid)return;
        const {workspace}=getViewState();
        try {
          const message=validateRoomMessage(event.data,workspace);
          if(seen.has(message.id))return;
          accept(message);
        }catch { /* unknown workspace, invalid or malicious packet */ }
      };
    }
    render();
  }
  function accept(message) {
    if(seen.has(message.id))return;
    seen.add(message.id);
    messages.push(message);
    if(messages.length>60){
      const removed=messages.shift();
      seen.delete(removed.id);
    }
    renderFeed();
  }
  function selectedRef() {
    if(!refSelect.value)return null;
    const cut=refSelect.value.indexOf("/");
    if(cut < 1)return null;
    return {projectId:refSelect.value.slice(0,cut),eventId:refSelect.value.slice(cut+1)};
  }
  function displayDecision() {
    decisionPanel.replaceChildren();
    const ref=selectedRef();
    const found=ref && resolveContextRef(getViewState().workspace,ref);
    if(!found) {
      decisionPanel.append(make("p","muted","Select a decision or linked event to attach its reference to a message."));
      return;
    }
    decisionPanel.append(make("strong","",found.event.title));
    decisionPanel.append(make("span","conversation-small",`${found.project.title} · ${found.event.date} · ${found.event.type}`));
    decisionPanel.append(make("p","",found.event.summary));
    decisionPanel.append(make("span","conversation-small",
      found.event.sourceRefs.length
        ? `${found.event.sourceRefs.length} source reference(s) attached; inspect originals before acting.`
        : "No source references: treat as unverified."));
    const go=make("button","secondary conversation-jump","Inspect this event");
    go.type="button";
    go.addEventListener("click",()=>navigate(found.project.id,found.event.id));
    decisionPanel.append(go);
  }
  function renderFeed() {
    const {projectId,workspace}=getViewState();
    feed.replaceChildren();
    const visible=messages.filter(m=>m.projectId===projectId).slice(-40);
    if(!visible.length) {
      feed.append(make("p","conversation-empty",
        "No messages in this local room yet. Open a second signed-in ContextWise tab to exchange live preview messages."));
      return;
    }
    for(const message of visible) {
      const article=make("article","conversation-bubble"+(message.actorId===selfId?" from-me":""));
      const top=make("div","conversation-bubble-head");
      top.append(make("strong","",message.actorLabel));
      top.append(make("span","conversation-small",`${message.kind.replaceAll("-"," ")} · ${new Date(message.createdAt).toLocaleTimeString()}`));
      article.append(top);
      if(message.replyTo)article.append(make("span","conversation-small",`Reply to ${message.replyTo.slice(0,12)}`));
      article.append(make("p","",message.body));
      for(const ref of message.contextRefs) {
        const found=resolveContextRef(workspace,ref);
        if(!found)continue;
        const link=make("button","conversation-ref-pill",`Context: ${found.project.title} / ${found.event.title}`);
        link.type="button";
        link.addEventListener("click",()=>navigate(found.project.id,found.event.id));
        article.append(link);
      }
      const reply=make("button","secondary conversation-reply","Reply");
      reply.type="button";
      reply.addEventListener("click",()=>{
        replyTo=message.id;
        $("conversation-reply-target").textContent=`Replying to ${message.actorLabel}: ${message.body.slice(0,80)}`;
        field.focus();
      });
      article.append(reply);
      feed.append(article);
    }
    feed.scrollTop=feed.scrollHeight;
  }
  function render() {
    const {workspace,projectId,eventId}=getViewState();
    if(!workspace?.projects?.some(p=>p.id===projectId))return;
    if(currentProject!==projectId){
      currentProject=projectId;
      replyTo=null;
      $("conversation-reply-target").textContent="";
      preferredRef=null;
    }
    roomLabel.textContent=workspace.projects.find(p=>p.id===projectId).title;
    const options=contextChoices(workspace,projectId);
    const current=refSelect.value;
    refSelect.replaceChildren();
    const none=make("option","","No decision attached");
    none.value="";
    refSelect.append(none);
    for(const option of options){
      const el=make("option","",`${option.projectTitle}: ${option.title} (${option.date})`);
      el.value=`${option.projectId}/${option.eventId}`;
      refSelect.append(el);
    }
    const focused=preferredRef || (eventId ? `${projectId}/${eventId}` : "");
    const next=[focused,current].find(v=>v && options.some(o=>o.projectId+"/"+o.eventId===v)) || "";
    refSelect.value=next;
    const enabled=!!(activeUid && channel);
    postForm.querySelector("button[type=submit]").disabled=!enabled;
    field.disabled=!enabled;
    status.textContent=enabled
      ? "Local live preview: messages reach open ContextWise tabs in this browser profile, signed into the same account. Not ChatGPT-to-ChatGPT; nothing is persisted."
      : activeUid
        ? "This browser does not support local cross-tab messaging. Agent handoff copy still works."
        : "Sign in to exchange local preview messages. No external ChatGPT conversations are connected.";
    displayDecision();
    renderFeed();
  }
  postForm.addEventListener("submit",event=>{
    event.preventDefault();
    if(!channel || !activeUid)return;
    const {workspace,projectId}=getViewState();
    const input={
      schemaVersion:1,id:crypto.randomUUID(),projectId,actorId:selfId,
      actorLabel:actor.value.trim() || "Local participant",
      kind:kind.value,body:field.value.trim(),createdAt:new Date().toISOString(),
      contextRefs:selectedRef()?[selectedRef()]:[],replyTo
    };
    try {
      const message=validateRoomMessage(input,workspace);
      channel.postMessage(message);
      accept(message);
      field.value="";
      replyTo=null;
      $("conversation-reply-target").textContent="";
      $("conversation-action-status").textContent="Posted to this browser's local room; not delivered to external ChatGPT chats.";
    }catch(error){
      $("conversation-action-status").textContent=`Message not posted: ${error.message}`;
    }
  });
  refSelect.addEventListener("change",()=>{
    preferredRef=refSelect.value;
    displayDecision();
  });
  copy.addEventListener("click",async()=>{
    const {workspace,projectId}=getViewState();
    try {
      const packet=handoffPacket(workspace,projectId,selectedRef()?[selectedRef()]:[],messages);
      await navigator.clipboard.writeText(JSON.stringify(packet,null,2));
      $("conversation-action-status").textContent=
        "Agent context packet copied. Review it before pasting into another chat; it may contain project history.";
    }catch{
      $("conversation-action-status").textContent="Copy unavailable in this browser. No content was sent.";
    }
  });
  window.addEventListener("contextwise:auth",event=>attachAccount(event.detail?.uid||null));
  window.addEventListener("pagehide",()=>{channel?.close();});
  attachAccount(window.contextwiseCurrentUid||null);
  return {
    refresh:render,
    focusDecision(projectId,eventId) {
      if(getViewState().projectId!==projectId)return;
      preferredRef=`${projectId}/${eventId}`;
      render();
      $("conversation-hub").scrollIntoView({behavior:"smooth",block:"start"});
      field.focus();
    }
  };
}
