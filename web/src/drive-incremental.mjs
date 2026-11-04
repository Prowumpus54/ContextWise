// Read Ava's private incremental Google Docs only after the user's explicit
// Google Drive read-only consent. Never cache tokens or send data to Firebase.
import { MAX_IMPORT_BYTES } from "./validate.mjs";

export async function fetchAvaIncrementals(accessToken, folderId) {
  const q=encodeURIComponent(`'${folderId}' in parents and name contains 'ContextWise_Ava_Incremental_Archive_' and mimeType = 'application/vnd.google-apps.document' and trashed = false`);
  const listResponse=await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name)&pageSize=100`,
    {headers:{Authorization:`Bearer ${accessToken}`}}
  );
  if(!listResponse.ok)throw new Error("Could not list private incremental archives");
  const listing=await listResponse.json();
  if(listing.nextPageToken)throw new Error("More than 100 archives; refusing an incomplete import");
  const files=(listing.files||[]).filter(f=>/^ContextWise_Ava_Incremental_Archive_[0-9TZ]+$/.test(f.name||""));
  const documents=[];
  for(const file of files) {
    const response=await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text%2Fplain`,
      {headers:{Authorization:`Bearer ${accessToken}`}}
    );
    if(!response.ok)throw new Error("Could not read a private incremental archive");
    const content=await response.text();
    if(content.length>MAX_IMPORT_BYTES)throw new Error("Incremental archive exceeds import size limit");
    documents.push(content);
  }
  return documents;
}
