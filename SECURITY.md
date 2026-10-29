# Turvallisuus

## Reported CodeQL findings: tested boundary, closure unverified

Oletushaaraan `0.7.0` kohdistuneessa turvallisuustarkastuksessa (2026-10-29) raportoitiin kaksi `js/xss-through-dom`-havaintoa:

* `custom_theme/js/start-flash-df69bd70.js:759` — 2 esiintymää

The reported location contains vendored Lit code (including lit-html 1.4.1 and a second newer runtime). A vendored library is not automatically safe; the data-flow boundary was tested below.

### Perustelut

1. The bundle contains two `innerHTML` template sinks, one in each vendored Lit runtime. The earlier statement that there was only one sink was incorrect.
2. In both template builders, HTML comes from template literal strings, not interpolated values. Values are committed separately. The log component renders an error message as a text value, not a template string.
3. Trusted Types policies return their input unchanged. They are not sanitizers and are not proof of safety.
4. `tests/lit-security.cjs` executes the actual bundle in jsdom. It checks malicious error-message markup in the real log component and the older Lit template builder. It requires the payload to remain text, with no injected image or script elements. This is a DOM regression, not a hardware flashing test or a full browser acceptance test.

Run the regression without changing the repository dependencies:

```sh
npm install --prefix /tmp/openhasp-security --no-audit --no-fund jsdom@26
NODE_PATH=/tmp/openhasp-security/node_modules node tests/lit-security.cjs
```

### Aidot korjaukset (jo tehty)

Aidot haavoittuvuudet korjattiin jo merged PR #1:sta (commit `1467ddc`, haara `0.7.0`):

* `custom_theme/js/installer.js`: `env`-tuloste `innerHTML` → `textContent` (DOM XSS).
* `custom_theme/js/installer.js`: firmware-nimen validointi regexillä `/^[A-Za-z0-9_.-]+$/` ennen `href`- ja `download`-attribuuttien asettamista (suojaa `javascript:`/`data:`-URI:ilta ja polkukävelyltä).

### Current disposition

The reproduced message path did not expose an exploitable HTML injection. No vendor runtime rewrite or alert dismissal is proposed. The current alert details and data-flow traces could not be retrieved with available API access, so the two findings remain unverified rather than declared closed. This regression and corrected explanation do not suppress scanning.

## Yhteydenotto

Turvallisuusasioista vastaa repositorion ylläpitäjä. Avaa tarvittaessa uusi issue turvallisuusluokituksella.
