/**
 * Fichiers à installer sur le routeur MikroTik d'un site :
 * - `login.html` : la page de connexion du Wi-Fi (logo Ronetz, nom du site, identifiant et mot de
 *   passe, bouton « Acheter un accès » vers la page d'achat du site). Autonome : le client n'a pas
 *   encore Internet, donc styles, logo et chiffrement CHAP sont dans le fichier.
 * - `ronetz-walled-garden.rsc` : autorise le site Ronetz avant connexion (HTTP et HTTPS), pour que
 *   le client puisse acheter. Relançable sans doublon (entrées marquées « ronetz »).
 *
 * Les variables `$(…)` sont celles du Hotspot MikroTik ; le routeur les remplace à l'affichage.
 */

/** Adresse publique du site Ronetz (page d'achat). */
export const PUBLIC_ORIGIN = (
  process.env.NEXT_PUBLIC_PUBLIC_ORIGIN ?? "https://ronetz.com"
).replace(/\/+$/, "");

/** Domaines à ouvrir avant connexion : le site et son API. */
export function walledGardenHosts(origin = PUBLIC_ORIGIN) {
  const host = new URL(origin).hostname.replace(/^www\./, "");
  return [host, `www.${host}`, `api.${host}`];
}

const html = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/\$/g, "&#36;");

/** Texte sûr pour un commentaire RouterOS : ASCII seulement, sans guillemets ni variables. */
const rscText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[^\x20-\x7e]/g, "")
    .replace(/[\\"$]/g, " ");

/**
 * MD5 compact (domaine public, d'après Joseph Myers), nécessaire au mode CHAP du Hotspot :
 * le mot de passe part haché avec le défi du routeur, jamais en clair.
 */
export const MD5_SOURCE = `function md5cycle(x,k){var a=x[0],b=x[1],c=x[2],d=x[3];
a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
x[0]=add32(a,x[0]);x[1]=add32(b,x[1]);x[2]=add32(c,x[2]);x[3]=add32(d,x[3]);}
function cmn(q,a,b,x,s,t){a=add32(add32(a,q),add32(x,t));return add32((a<<s)|(a>>>(32-s)),b);}
function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t);}
function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t);}
function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t);}
function md51(s){var n=s.length,state=[1732584193,-271733879,-1732584194,271733878],i;
for(i=64;i<=n;i+=64){md5cycle(state,md5blk(s.substring(i-64,i)));}
s=s.substring(i-64);var tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
for(i=0;i<s.length;i++)tail[i>>2]|=s.charCodeAt(i)<<((i%4)<<3);
tail[i>>2]|=0x80<<((i%4)<<3);
if(i>55){md5cycle(state,tail);for(i=0;i<16;i++)tail[i]=0;}
tail[14]=n*8;md5cycle(state,tail);return state;}
function md5blk(s){var b=[],i;for(i=0;i<64;i+=4){b[i>>2]=s.charCodeAt(i)+(s.charCodeAt(i+1)<<8)+(s.charCodeAt(i+2)<<16)+(s.charCodeAt(i+3)<<24);}return b;}
var hexChr="0123456789abcdef".split("");
function rhex(n){var s="",j=0;for(;j<4;j++)s+=hexChr[(n>>(j*8+4))&15]+hexChr[(n>>(j*8))&15];return s;}
function hexMD5(s){var x=md51(s),i;for(i=0;i<x.length;i++)x[i]=rhex(x[i]);return x.join("");}
function add32(a,b){return(a+b)&0xFFFFFFFF;}`;

const LOGO_PATHS = `<path d="M 365.33 640.71 C 406.70 637.01 470.61 659.45 488.5 699.50 C 508.32 743.86 492.32 790.48 448.70 811.66 C 451.63 814.71 454.76 818.52 457.46 821.80 C 487.21 857.84 519.45 892.08 548.99 928.27 C 525.17 929.33 495.78 928.58 471.64 928.49 C 464.95 921.89 451.51 905.31 444.91 897.75 C 427.34 877.62 409.67 857.58 391.89 837.64 C 387.35 832.48 371.34 813.59 366.70 810.51 C 362.82 810.58 358.82 814.46 356.17 817.22 C 337.62 836.57 338.64 851.73 338.63 876.04 L 338.65 910.86 L 338.69 928.53 C 319.28 928.68 299.87 928.66 280.46 928.49 L 280.48 882.39 C 280.54 844.77 281.35 818.48 306.15 786.32 C 319.69 768.77 343.78 748.15 366.64 745.94 C 386.29 744.04 395.16 751.92 409.30 763.22 C 440.89 765.20 448.01 729.20 427.14 713.83 C 394.14 689.53 340.01 694.24 308.80 719.72 C 296.75 729.57 289.96 738.61 280.31 750.80 C 265.55 739.04 249.23 726.38 235.00 714.19 C 238.47 708.42 245.27 699.85 249.82 694.92 C 281.89 660.20 318.82 643.38 365.33 640.71 Z"/><path d="M 357.05 537.21 C 359.07 536.98 362.87 536.95 365.03 536.92 C 431.84 535.99 501.20 560.91 549.56 607.29 C 537.44 621.11 522.92 636.01 510.16 649.41 C 454.76 600.48 391.88 584.94 319.74 600.86 C 265.29 614.60 232.89 642.38 199.19 684.96 C 184.70 672.59 168.40 659.35 154.50 646.61 C 159.58 639.86 164.93 633.31 170.53 626.98 C 219.46 571.58 283.61 541.79 357.05 537.21 Z"/>`;

/** Page de connexion du Hotspot pour un site. */
export function hotspotLoginHtml(
  site: { id: string; name: string },
  origin = PUBLIC_ORIGIN,
) {
  const buy = `${origin}/connect/${encodeURIComponent(site.id)}`;
  const name = html(site.name);
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="pragma" content="no-cache">
<meta http-equiv="expires" content="-1">
<title>Wi-Fi ${name}</title>
<style>
:root{--paper:#fff;--field:#c9d1d9;--ink:#17212f;--muted:#5d6877;--line:#e3e7ec;--bg:#f6f8f7;--brand:#047857;--brand-ink:var(--paper);--danger:#b42318;--danger-bg:#fdecec}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;background:var(--bg);color:var(--ink);font:15px/1.45 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px 16px}
main{width:100%;max-width:380px;background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:28px 24px;box-shadow:0 1px 2px rgba(0,0,0,.04)}
.brand{display:flex;align-items:center;gap:8px;font-weight:600;font-size:18px;letter-spacing:-.03em}
.brand svg{width:26px;height:26px;fill:var(--brand)}
h1{font-size:21px;line-height:1.3;margin:20px 0 4px}
p.lead{margin:0 0 20px;color:var(--muted)}
label{display:block;font-weight:600;font-size:14px;margin:14px 0 6px}
input{width:100%;height:46px;border:1px solid var(--field);border-radius:9px;padding:0 12px;font:inherit;background:var(--paper);color:var(--ink)}
input:focus{outline:2px solid var(--brand);outline-offset:1px;border-color:var(--brand)}
button,.buy{display:flex;align-items:center;justify-content:center;width:100%;height:48px;border-radius:9px;font:600 15px/1 inherit;text-decoration:none;cursor:pointer}
button{margin-top:20px;border:0;background:var(--brand);color:var(--brand-ink)}
.sep{display:flex;align-items:center;gap:10px;color:var(--muted);font-size:13px;margin:22px 0 12px}
.sep:before,.sep:after{content:"";flex:1;height:1px;background:var(--line)}
.buy{border:1px solid var(--line);color:var(--ink);background:var(--paper)}
.error{margin:0 0 4px;padding:10px 12px;border-radius:9px;background:var(--danger-bg);color:var(--danger);font-size:14px}
.note{margin:16px 0 0;color:var(--muted);font-size:13px;text-align:center}
footer{margin-top:18px;text-align:center;color:var(--muted);font-size:12px}
</style>
</head>
<body>
$(if chap-id)
<form name="sendin" action="$(link-login-only)" method="post" style="display:none">
<input type="hidden" name="username"><input type="hidden" name="password">
<input type="hidden" name="dst" value="$(link-orig)"><input type="hidden" name="popup" value="false">
</form>
<script>
${MD5_SOURCE}
function doLogin(){document.sendin.username.value=document.login.username.value;
document.sendin.password.value=hexMD5('$(chap-id)'+document.login.password.value+'$(chap-challenge)');
document.sendin.submit();return false;}
</script>
$(endif)
<main>
<div class="brand"><svg viewBox="140 520 425 425" aria-hidden="true">${LOGO_PATHS}</svg>ronetz</div>
<h1>Wi-Fi ${name}</h1>
<p class="lead">Saisissez l’identifiant et le mot de passe de votre accès.</p>
$(if error)<p class="error" role="alert">$(error)</p>$(endif)
<form name="login" action="$(link-login-only)" method="post" $(if chap-id)onsubmit="return doLogin()"$(endif)>
<input type="hidden" name="dst" value="$(link-orig)"><input type="hidden" name="popup" value="false">
<label for="username">Identifiant</label>
<input id="username" name="username" type="text" value="$(username)" autocomplete="username" autocapitalize="none" spellcheck="false" required>
<label for="password">Mot de passe</label>
<input id="password" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Se connecter</button>
</form>
<div class="sep">Pas encore d’accès ?</div>
<a class="buy" href="${html(buy)}">Acheter un accès</a>
<p class="note">Paiement par MTN Mobile Money ou Orange Money. Le temps de l’accès commence dès l’achat.</p>
</main>
<footer>Propulsé par ronetz</footer>
</body>
</html>
`;
}

/** Script RouterOS : ouvre le site Ronetz avant connexion. Relançable sans doublon. */
export function walledGardenScript(
  site: { name: string },
  origin = PUBLIC_ORIGIN,
) {
  const hosts = walledGardenHosts(origin);
  const lines = [
    `# Ronetz : page d'achat accessible avant connexion (site ${rscText(site.name)}).`,
    `# A importer dans le routeur : /import file-name=ronetz-walled-garden.rsc`,
    `# Relancable : les anciennes entrees « ronetz » sont remplacees.`,
    `/ip hotspot walled-garden remove [find where comment~"^ronetz"]`,
    `/ip hotspot walled-garden ip remove [find where comment~"^ronetz"]`,
    ...hosts.map(
      (h) =>
        `/ip hotspot walled-garden add dst-host=${h} action=allow comment="ronetz ${h}"`,
    ),
    // Les pages en HTTPS ne passent pas par le proxy du Hotspot : il faut aussi les ouvrir en IP.
    ...hosts.map(
      (h) =>
        `/ip hotspot walled-garden ip add dst-host=${h} action=accept comment="ronetz https ${h}"`,
    ),
    `:put "Ronetz : ${hosts.length} domaines ouverts avant connexion."`,
    "",
  ];
  return lines.join("\r\n");
}

/** Télécharge un texte comme fichier, dans le navigateur. */
export function downloadText(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
