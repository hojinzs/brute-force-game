import axios from "axios";

import type { ApiBlockHistoryEntry } from "./model/normalize-history";

export type ApiBlockHistoryPageResponse = {
  page: number;
  limit: number;
  total: number;
  blocks: ApiBlockHistoryEntry[];
};

export async function getBlockHistoryPage(params: { page: number; limit: number }) {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const url = new URL("/blocks", baseURL).toString();

  const response = await axios.get<ApiBlockHistoryPageResponse>(url, { params });
  return response.data;
}

