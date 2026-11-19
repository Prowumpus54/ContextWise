// Read Ava's private incremental Google Docs only after the user's explicit
// Google Drive read-only consent. Never cache tokens or send data to Firebase.
import { MAX_IMPORT_BYTES } from "./validate.mjs";

// Ava's historical and current private archives use two filename conventions.
// Keep this filter narrow so unrelated Docs are never exported as archives.
const avaName = /^ContextWise_Ava_Incremental_(?:Archive_)?[0-9]{8}T[0-9]{4,6}Z(?:_[0-9]{8}T[0-9]{4,6}Z)?(?:_PRIVATE)?$/;
export function isAvaIncrementalName(name) {
  return typeof name === "string" && avaName.test(name);
}

export async function fetchAvaIncrementals(accessToken, folderId) {
  const q=encodeURIComponent(`'${folderId}' in parents and name contains 'ContextWise_Ava_Incremental_' and mimeType = 'application/vnd.google-apps.document' and trashed = false`);
  const listResponse=await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name)&pageSize=100`,
    {headers:{Authorization:`Bearer ${accessToken}`}}
  );
  if(!listResponse.ok)throw new Error("Could not list private incremental archives");
  const listing=await listResponse.json();
  if(listing.nextPageToken)throw new Error("More than 100 archives; refusing an incomplete import");
  const files=(listing.files||[]).filter(f=>isAvaIncrementalName(f.name));
  const documents=[];
  let totalCharacters=0;
  for(const file of files) {
    const response=await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file.id)}/export?mimeType=text%2Fplain`,
      {headers:{Authorization:`Bearer ${accessToken}`}}
    );
    if(!response.ok)throw new Error("Could not read a private incremental archive");
    const content=await response.text();
    totalCharacters+=content.length;
    if(totalCharacters>MAX_IMPORT_BYTES)throw new Error("Combined incremental archive exceeds 2 MB import limit");
    documents.push(content);
  }
  return documents;
}
