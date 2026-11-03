"use strict";
const admin=require("firebase-admin");
const {onRequest}=require("firebase-functions/v2/https");
const {defineSecret,defineString}=require("firebase-functions/params");
const {handle}=require("./lib/relay");
admin.initializeApp();
const relayKey=defineSecret("CONTEXTWISE_RELAY_KEY");
const ownerUid=defineString("CONTEXTWISE_OWNER_UID");
exports.relay=onRequest({
  region:"us-central1",memory:"256MiB",timeoutSeconds:30,
  maxInstances:4,concurrency:20,secrets:[relayKey],cors:false
},(req,res)=>handle(req,res,{
  db:admin.firestore(),
  verifyIdToken:token=>admin.auth().verifyIdToken(token,true),
  key:relayKey.value(),ownerUid:ownerUid.value()
}));
