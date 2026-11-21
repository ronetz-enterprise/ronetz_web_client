/**
 * Chemins du module `access` du backend. Les transitions n'acceptent aucun corps.
 * Seule la pagination est filtrée par le serveur ; la recherche et les puces filtrent la page lue.
 */
type OrgApi = (path?: string) => string;

export const accessEndpoints = {
  list: (orgApi: OrgApi) => orgApi("/access-grants"),
  siteList: (orgApi: OrgApi, siteId: string) =>
    orgApi(`/sites/${siteId}/access-grants`),
  manualGrant: (orgApi: OrgApi, siteId: string) =>
    orgApi(`/sites/${siteId}/access-grants/manual`),
  detail: (accessGrantId: string) => `/api/access-grants/${accessGrantId}`,
  suspension: (accessGrantId: string) =>
    `/api/access-grants/${accessGrantId}/suspension`,
  revocation: (accessGrantId: string) =>
    `/api/access-grants/${accessGrantId}/revocation`,
  projectionRetries: (accessGrantId: string) =>
    `/api/access-grants/${accessGrantId}/projection-retries`,
  /** Le jeton de récupération va dans le corps, jamais dans l'adresse. */
  credentialDelivery: (accessGrantId: string) =>
    `/api/public/access-grants/${accessGrantId}/credential-delivery`,
};

export const accessTransitions = {
  suspend: (id: string) => ({
    method: "POST",
    path: accessEndpoints.suspension(id),
  }),
  resume: (id: string) => ({
    method: "DELETE",
    path: accessEndpoints.suspension(id),
  }),
  revoke: (id: string) => ({
    method: "POST",
    path: accessEndpoints.revocation(id),
  }),
  retryProjection: (id: string) => ({
    method: "POST",
    path: accessEndpoints.projectionRetries(id),
  }),
} as const;

export type AccessTransition = keyof typeof accessTransitions;
