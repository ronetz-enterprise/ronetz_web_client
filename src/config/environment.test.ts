import { expect, it } from "vitest";
import { parseEnvironment } from "./environment";

const base = {
  NEXT_PUBLIC_API_BASE_URL: "",
  NEXT_PUBLIC_APP_ENV: "development",
  NEXT_PUBLIC_ENABLE_MOCKS: "false",
};

it("accepte une configuration de développement et retire la barre finale", () => {
  expect(
    parseEnvironment({
      ...base,
      NEXT_PUBLIC_API_BASE_URL: "https://api.ronetz.test/",
    }),
  ).toEqual({
    apiBaseUrl: "https://api.ronetz.test",
    appEnv: "development",
    enableMocks: false,
  });
});

it("refuse les mocks en production", () => {
  expect(() =>
    parseEnvironment({
      ...base,
      NEXT_PUBLIC_APP_ENV: "production",
      NEXT_PUBLIC_ENABLE_MOCKS: "true",
    }),
  ).toThrow();
});

it("refuse une URL avec identifiants", () => {
  expect(() =>
    parseEnvironment({
      ...base,
      NEXT_PUBLIC_API_BASE_URL: "https://user:pw@api.test",
    }),
  ).toThrow();
});

it("refuse les mocks dans un build de production, même sans environnement déclaré", () => {
  expect(() =>
    parseEnvironment(
      {
        ...base,
        NEXT_PUBLIC_APP_ENV: "development",
        NEXT_PUBLIC_ENABLE_MOCKS: "true",
      },
      "production",
    ),
  ).toThrow(/Mode simulé interdit/);
});

it("autorise les mocks sous le serveur de développement", () => {
  expect(
    parseEnvironment(
      { ...base, NEXT_PUBLIC_ENABLE_MOCKS: "true" },
      "development",
    ).enableMocks,
  ).toBe(true);
});
