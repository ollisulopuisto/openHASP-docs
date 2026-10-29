# Turvallisuus

## Raportoidut CodeQL-löydökset: väärä positiivinen

Oletushaaraan `0.7.0` kohdistuneessa turvallisuustarkastuksessa (2026-10-29) raportoitiin kaksi `js/xss-through-dom`-havaintoa:

* `custom_theme/js/start-flash-df69bd70.js:759` — 2 esiintymää

Molemmat havainnot osuvat **minifioituun, vendoroituun kolmannen osapuolen kirjastoon** (`lit-html` 1.4.1 / `LitElement` 2.4.0 runtime), ei repositorion omaan koodiin. Ne ovat **väärä positiivinen**, ja niitä ei korjata koodimuutoksella.

### Perustelut

1. Ainoa `innerHTML`-käyttö tiedostossa on rivillä 554 (`static createElement`), jota lit-html käyttää **vain staattisten mallipohjien** rakentamiseen.
2. Kaikki dynaamiset arvot (esim. `esp-web-flash-log`-komponentin viestit) lit-html kirjoittaa `document.createTextNode`/`textContent`-kautta — niitä ei koskaan tulkita HTML:nä.
3. Kirjasto ottaa jo käyttöön Trusted Types -käytännön `"lit-html"` (`createHTML: e => e`, rivit 474–475).
4. Minifioitua kolmannen osapuolen koodia ei ole turvallista eikä mielekästä muokata käsin; se rikkoisi kirjastoa ja vaikeuttaisi päivityksiä.

### Aidot korjaukset (jo tehty)

Aidot haavoittuvuudet korjattiin jo merged PR #1:sta (commit `1467ddc`, haara `0.7.0`):

* `custom_theme/js/installer.js`: `env`-tuloste `innerHTML` → `textContent` (DOM XSS).
* `custom_theme/js/installer.js`: firmware-nimen validointi regexillä `/^[A-Za-z0-9_.-]+$/` ennen `href`- ja `download`-attribuuttien asettamista (suojaa `javascript:`/`data:`-URI:ilta ja polkukävelyltä).

### Päätös

Kaksi `js/xss-through-dom`-havaintoa merkitään vääräksi positiiviseksi. Tiedostoon `custom_theme/js/start-flash-df69bd70.js` ei tehdä muutosta. Tätä tarkastusta varten ei avata erillistä pull requestia, koska korjattavaa koodimuutosta ei ole.

## Yhteydenotto

Turvallisuusasioista vastaa repositorion ylläpitäjä. Avaa tarvittaessa uusi issue turvallisuusluokituksella.
