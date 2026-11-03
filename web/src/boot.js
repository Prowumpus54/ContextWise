// Startup diagnostics before ES modules. Never collect account data or tokens.
window.contextwiseBoot = { initialized: true, moduleErrors: [], runtimeErrors: 0, promiseRejections: 0 };
window.addEventListener("error", event => {
  const state=window.contextwiseBoot;
  if (event.target && event.target.tagName === "SCRIPT") {
    state.moduleErrors.push({ module:event.target.dataset.module||"unknown",reason:"script-load-error" });
  } else {
    state.runtimeErrors++;
    const message=String(event.message||"");
    if(message.includes("does not provide an export"))state.moduleErrors.push({reason:"missing-module-export"});
    else if(message.includes("Failed to fetch"))state.moduleErrors.push({reason:"module-fetch-failed"});
  }
  state.moduleErrors=state.moduleErrors.slice(-10);
}, true);
window.addEventListener("unhandledrejection",()=>{
  window.contextwiseBoot.promiseRejections++;
});
