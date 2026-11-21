import { describe, expect, it } from "vitest";
import {
  countryName,
  nameChanged,
  organizationDetailSchema,
  organizationNameSchema,
} from "./organization";

const detail = {
  id: "1e8f48a9-cc92-447c-9fae-50a0415fb566",
  name: "Cyber Akwa",
  country: "CM",
  currency: "XAF",
  status: "ACTIVE",
  suspensionReason: null,
  suspendedAt: null,
  closedAt: null,
  createdAt: "2026-11-16T21:32:32.744064Z",
  updatedAt: "2026-11-16T21:32:32.744064Z",
};

describe("organizationDetailSchema", () => {
  it("accepte la réponse du backend", () => {
    expect(organizationDetailSchema.safeParse(detail).success).toBe(true);
  });
  it("refuse un pays ou une devise mal formés", () => {
    expect(
      organizationDetailSchema.safeParse({ ...detail, country: "cameroun" })
        .success,
    ).toBe(false);
    expect(
      organizationDetailSchema.safeParse({ ...detail, currency: "xaf" })
        .success,
    ).toBe(false);
  });
});

describe("organizationNameSchema", () => {
  it("refuse un nom vide ou trop long", () => {
    expect(organizationNameSchema.safeParse({ name: "   " }).success).toBe(
      false,
    );
    expect(
      organizationNameSchema.safeParse({ name: "a".repeat(151) }).success,
    ).toBe(false);
    expect(
      organizationNameSchema.safeParse({ name: "Cyber Akwa 2" }).success,
    ).toBe(true);
  });
});

describe("nameChanged", () => {
  it("ignore les espaces de bord et le nom vide", () => {
    expect(nameChanged("Cyber Akwa", " Cyber Akwa ")).toBe(false);
    expect(nameChanged("Cyber Akwa", "")).toBe(false);
    expect(nameChanged("Cyber Akwa", "Cyber Bonamoussadi")).toBe(true);
  });
});

describe("countryName", () => {
  it("retombe sur le code quand le catalogue manque", () => {
    expect(countryName("CM", undefined)).toBe("CM");
    expect(
      countryName("CM", [
        {
          code: "CM",
          name: "Cameroun",
          currency: "XAF",
          timeZone: "Africa/Douala",
          open: true,
        },
      ]),
    ).toBe("Cameroun");
  });
});
