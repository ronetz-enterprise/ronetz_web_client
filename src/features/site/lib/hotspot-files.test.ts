import { describe, expect, it } from "vitest";

import {
  MD5_SOURCE,
  hotspotLoginHtml,
  walledGardenHosts,
  walledGardenScript,
} from "./hotspot-files";

const site = { id: "14eb1d1d-9823-42cc-9029-25a7dd5da02f", name: "Cyber Akwa" };

describe("page de connexion du Hotspot", () => {
  it("le MD5 embarqué donne les empreintes de référence (CHAP)", () => {
    const hexMD5 = new Function(`${MD5_SOURCE}; return hexMD5;`)() as (
      s: string,
    ) => string;
    expect(hexMD5("")).toBe("d41d8cd98f00b204e9800998ecf8427e");
    expect(hexMD5("abc")).toBe("900150983cd24fb0d6963f7d28e17f72");
    expect(hexMD5("a".repeat(100))).toBe("36a92cc94a9e0fa21f625f8bfb007adf");
    // Défi CHAP : octets bruts (\\012…) issus des variables du routeur.
    expect(hexMD5("\x0a\xe5" + "secret" + "\x01\xff")).toMatch(
      /^[0-9a-f]{32}$/,
    );
  });

  it("mène à la page d'achat du site et garde les variables du routeur", () => {
    const page = hotspotLoginHtml(site, "https://ronetz.com");
    expect(page).toContain(`href="https://ronetz.com/connect/${site.id}"`);
    expect(page).toContain('action="$(link-login-only)"');
    expect(page).toContain("$(if chap-id)");
    expect(page).toContain("Wi-Fi Cyber Akwa");
  });

  it("neutralise le nom du site (HTML et variables MikroTik)", () => {
    const page = hotspotLoginHtml(
      { id: site.id, name: '<b>$(username)"x' },
      "https://ronetz.com",
    );
    expect(page).not.toContain("<b>");
    expect(page).toContain("&lt;b&gt;&#36;(username)&quot;x");
  });
});

describe("script d'accès au site avant connexion", () => {
  it("ouvre le site et son API, en HTTP et en HTTPS, sans doublon", () => {
    expect(walledGardenHosts("https://ronetz.com")).toEqual([
      "ronetz.com",
      "www.ronetz.com",
      "api.ronetz.com",
    ]);
    const script = walledGardenScript(
      { name: 'Akwa "nord"' },
      "https://www.ronetz.com/",
    );
    expect(script).toContain(
      '/ip hotspot walled-garden remove [find where comment~"^ronetz"]',
    );
    expect(script).toContain(
      "/ip hotspot walled-garden add dst-host=api.ronetz.com action=allow",
    );
    expect(script).toContain(
      "/ip hotspot walled-garden ip add dst-host=ronetz.com action=accept",
    );
    expect(script).not.toContain('"nord"');
    expect(
      script
        .split("\r\n")
        .filter((l) => l.startsWith("/ip hotspot walled-garden")),
    ).toHaveLength(8);
  });
});
