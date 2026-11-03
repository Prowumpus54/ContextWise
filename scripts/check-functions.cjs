"use strict";
const assert=require("node:assert/strict");
const functions=require("../functions/index.js");
assert.equal(typeof functions.relay,"function");
console.log("Cloud Functions v2 relay entrypoint loads");
