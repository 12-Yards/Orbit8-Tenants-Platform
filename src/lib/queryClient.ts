import { AxiosResponse } from "axios";
import api from "@/lib/api";

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<AxiosResponse> {
  const response = await api.request({
    method,
    url,
    data: data ?? undefined,
  });
  return response;
}
