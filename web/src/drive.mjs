// Browser-only Google Drive connector.
// Google Drive access tokens stay in memory; no Firebase JSON archive upload.
import { GoogleAuthProvider, reauthenticateWithPopup } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import { auth } from "./auth.mjs?v=0.1.11";
import { normalizeWorkspace, MAX_IMPORT_BYTES } from "./validate.mjs";
import { mergeAvaRecords } from "./ava-archive.mjs";
import { fetchAvaIncrementals } from "./drive-incremental.mjs";
import { parseDriveApiError, driveApiGuidance } from "./drive-error.mjs";

const connect = document.getElementById("drive-connect");
const driveStatus = document.getElementById("drive-status");
const apiHelp = document.getElementById("drive-api-help");
const loadButton = document.getElementById("drive-load");
const loadStatus = document.getElementById("drive-load-status");
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_READ_SCOPE = "https://www.googleapis.com/auth/drive.readonly";
let token = null;
let folderId = null;
const diagnostics = {
  moduleLoaded:true, authEvents:0, lastOperation:"idle",
  lastHttpStatus:null,lastApiReason:null,lastApiStatus:null,lastErrorCode:null,
  archiveLoad:"idle",archiveProjectCount:0,archiveRelationCount:0
};
window.contextwiseDriveDiagnostics = diagnostics;
function emitDiagnostics(){window.dispatchEvent(new Event("contextwise:drive-diagnostics"));}
function reset(){
  token=null;
  folderId=null;
  connect.disabled=!auth.currentUser;
  loadButton.disabled=!auth.currentUser;
  apiHelp.hidden=true;
  driveStatus.textContent="Drive not connected.";
  loadStatus.textContent=auth.currentUser?"Choose Load archived projects to read your private Drive archive.":"Sign in to load your private archives.";
}
window.addEventListener("contextwise:auth",()=>{
  diagnostics.authEvents++;
  diagnostics.archiveLoad="idle";
  reset();
});
reset();

async function oauthToken(scope) {
  if(!auth.currentUser)throw new Error("Sign in first");
  const provider=new GoogleAuthProvider();
  provider.addScope(scope);
  provider.setCustomParameters({prompt:"consent"});
  const result=await reauthenticateWithPopup(auth.currentUser,provider);
  const credential=GoogleAuthProvider.credentialFromResult(result);
  if(!credential?.accessToken)throw new Error("Google Drive access token unavailable");
  return credential.accessToken;
}
async function apiRequest(url, operation, accessToken, options={}) {
  diagnostics.lastOperation=operation;
  const response=await fetch(url,{
    ...options,
    headers:{
      Authorization:`Bearer ${accessToken}`,
      ...(options.body?{"Content-Type":"application/json"}:{})
    }
  });
  if(!response.ok){
    let body=null;
    try{body=await response.json();}catch{}
    const info=parseDriveApiError(response.status,body);
    throw Object.assign(new Error(driveApiGuidance(info)),info);
  }
  return response.json();
}
function recordError(error) {
  diagnostics.lastHttpStatus=Number.isInteger(error?.httpStatus)?error.httpStatus:null;
  diagnostics.lastApiReason=error?.reason||null;
  diagnostics.lastApiStatus=error?.apiStatus||null;
  const code=String(error?.code||error?.name||"unknown");
  diagnostics.lastErrorCode=/^[A-Za-z0-9/_-]{1,80}$/.test(code)?code:"unknown";
  return diagnostics.lastHttpStatus
    ? driveApiGuidance({httpStatus:diagnostics.lastHttpStatus,reason:diagnostics.lastApiReason})
    : diagnostics.lastErrorCode.startsWith("auth/")
      ? `Google authorization failed (${diagnostics.lastErrorCode}).`
      : "Unable to complete the Google Drive operation.";
}
connect.addEventListener("click",async()=>{
  window.contextwiseRecordAccess?.("drive","attempt");
  connect.disabled=true;
  apiHelp.hidden=true;
  Object.assign(diagnostics,{lastHttpStatus:null,lastApiReason:null,lastApiStatus:null,lastErrorCode:null});
  try {
    token=await oauthToken(DRIVE_FILE_SCOPE);
    const query=encodeURIComponent("name = 'ContextWise' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
    const existing=await apiRequest(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name),nextPageToken&pageSize=100`,
      "find-folder",token);
    folderId=existing.files?.[0]?.id||null;
    if(!folderId){
      const created=await apiRequest("https://www.googleapis.com/drive/v3/files?fields=id,name","create-folder",token,{
        method:"POST",body:JSON.stringify({name:"ContextWise",mimeType:"application/vnd.google-apps.folder"})
      });
      folderId=created.id||null;
      if(!folderId)throw new Error("No Drive folder ID");
    }
    diagnostics.lastOperation="connected";
    window.contextwiseRecordAccess?.("drive","success");
    driveStatus.textContent="Connected to Google Drive. ContextWise folder ready. No archives uploaded by this browser.";
  }catch(error){
    token=null;folderId=null;
    window.contextwiseRecordAccess?.("drive","failed",String(error?.reason||error?.code||"unknown"));
    driveStatus.textContent=`Drive connection failed: ${recordError(error)}`;
    apiHelp.hidden=diagnostics.lastHttpStatus!==403;
  }finally{connect.disabled=!auth.currentUser;emitDiagnostics();}
});

async function getFolderForRead(accessToken) {
  if(folderId)return folderId;
  const q=encodeURIComponent("name = 'ContextWise' and mimeType = 'application/vnd.google-apps.folder' and trashed = false");
  const found=await apiRequest(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name)&pageSize=100`,
    "find-private-archive-folder",accessToken);
  if(found.files?.length!==1 || found.nextPageToken){
    throw new Error("Expected exactly one ContextWise folder. Resolve duplicate folder names in Drive before loading.");
  }
  return found.files[0].id;
}
async function latestArchive(accessToken, archiveFolder) {
  const q=encodeURIComponent(`'${archiveFolder}' in parents and name contains 'contextwise-workspace-' and mimeType = 'application/json' and trashed = false`);
  const url=`https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,size,modifiedTime)&pageSize=100&orderBy=modifiedTime%20desc`;
  const list=await apiRequest(url,"list-private-archives",accessToken);
  const candidates=(list.files||[]).filter(file=>
    /^contextwise-workspace-[a-zA-Z0-9_-]+\.json$/.test(file.name||""));
  if(list.nextPageToken)throw new Error("Too many combined archives to safely choose latest.");
  return candidates[0] || null;
}
loadButton.addEventListener("click",async()=>{
  if(!auth.currentUser)return;
  window.contextwiseRecordAccess?.("archive","attempt");
  loadButton.disabled=true;
  diagnostics.archiveLoad="authorizing";
  diagnostics.archiveProjectCount=0;
  diagnostics.archiveRelationCount=0;
  loadStatus.textContent="Requesting optional Google Drive read-only permission...";
  emitDiagnostics();
  try {
    // Separate opt-in from drive.file. This scope is broader than the folder.
    const readToken=await oauthToken(DRIVE_READ_SCOPE);
    const archiveFolder=await getFolderForRead(readToken);
    const file=await latestArchive(readToken,archiveFolder);
    const incrementalDocs=await fetchAvaIncrementals(readToken,archiveFolder);
    if(!file && !incrementalDocs.length)throw new Error("No ContextWise archives found");
    if(file && Number(file.size)>MAX_IMPORT_BYTES)throw new Error("Archive exceeds 2 MB import limit");
    let raw=null;
    if(file) {
      diagnostics.lastOperation="read-private-archive";
      raw=await apiRequest(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}?alt=media`,
        "read-private-archive",readToken);
    }
    const {workspace,added}=mergeAvaRecords(raw,incrementalDocs);
    const n=workspace.projects.reduce((sum,p)=>sum+p.events.length,0);
    window.dispatchEvent(new CustomEvent("contextwise:workspace-loaded",{detail:{workspace}}));
    diagnostics.archiveLoad="loaded";
    window.contextwiseRecordAccess?.("archive","success");
    diagnostics.archiveProjectCount=workspace.projects.length;
    diagnostics.archiveRelationCount=workspace.relations.length;
    loadStatus.textContent=`Loaded ${workspace.projects.length} projects, ${n} events and ${workspace.relations.length} relationships. Added ${added} unique Ava bulletin events from private incremental archives. Nothing was uploaded to Firebase.`;
  }catch(error){
    diagnostics.archiveLoad="error";
    window.contextwiseRecordAccess?.("archive","failed",String(error?.reason||error?.code||error?.name||"unknown"));
    // Do not expose arbitrary Google error text or private filenames in diagnostics.
    loadStatus.textContent=error?.httpStatus
      ?`Could not load Drive archive: ${recordError(error)}`
      : String(error?.message||"Load failed").startsWith("No combined ContextWise")?"No combined ContextWise workspace archive was found."
      : "Unable to load your Drive archive. Check permissions, folder selection and JSON schema.";
    if(!error?.httpStatus) recordError(error);
  }finally{
    loadButton.disabled=!auth.currentUser;
    emitDiagnostics();
  }
});
