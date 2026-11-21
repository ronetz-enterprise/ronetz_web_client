import { organizationSchema } from "@/features/organizations";
import { ApiError } from "@/lib/api-error";
import type { RequestOptions } from "@/lib/http-client";
import {
  toCreateOrganizationDto,
  type CreateOrganizationInput,
} from "../schemas/create-organization";

export type AuthenticatedRequest = <T = unknown>(
  path: string,
  options?: Omit<RequestOptions, "accessToken">,
) => Promise<T>;

export async function createOrganization(
  request: AuthenticatedRequest,
  input: CreateOrganizationInput,
  key: string,
) {
  const response = await request("/api/organizations", {
    method: "POST",
    headers: { "Idempotency-Key": key },
    body: toCreateOrganizationDto(input),
  });
  const result = organizationSchema.safeParse(response);
  if (!result.success) throw new ApiError("invalid-response");
  return result.data;
}
