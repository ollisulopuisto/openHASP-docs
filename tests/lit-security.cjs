// Run with jsdom installed outside the repository, as SECURITY.md describes.
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

async function main() {
  const dom = new JSDOM("<!doctype html>", {
    runScripts: "outside-only",
    url: "https://example.test",
  });
  const filename = path.join(__dirname, "../custom_theme/js/start-flash-df69bd70.js");
  // Evaluate the actual shipped bundle; expose only existing private symbols.
  const source = fs.readFileSync(filename, "utf8");
  const exposed = source.replace(
    /export\{Wt as startFlash\};?$/,
    "window.__securityTest = { nt, Ct };"
  );
  assert.notEqual(exposed, source, "the expected bundle export was found");
  dom.window.eval(exposed);
  const { document, __securityTest } = dom.window;
  const payloads = [
    '<img src=x onerror="window.pwned=1"><script>window.pwned=2</script>',
    '<svg onload="window.pwned=3">& "quoted"',
  ];
  const log = document.createElement("esp-web-flash-log");
  document.body.append(log);
  for (const payload of payloads) {
    log.clear();
    log.addError(payload);
    await log.updateComplete;
    assert(log.shadowRoot.textContent.includes(payload));
    assert.equal(log.shadowRoot.querySelector("img,script,svg"), null);

    // The second, older Lit runtime is not the log's runtime. Exercise its
    // actual template creation AND commit path rather than assuming both match.
    const { nt, Ct } = __securityTest;
    const result = nt`<div>${payload}</div>`;
    const template = result.getTemplateElement();
    assert(!template.innerHTML.includes("onerror"));
    assert.equal(template.content.querySelector("img,script,svg"), null);
    const container = document.createElement("div");
    Ct.render(result, container, { scopeName: "security-regression" });
    assert.equal(container.textContent, payload);
    assert.equal(container.querySelector("img,script,svg"), null);
    assert.equal(dom.window.pwned, undefined);
  }
  dom.window.close();
  console.log("PASS actual bundle: both Lit runtimes preserve malicious markup as text");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
