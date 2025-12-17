import type { RawActionBlueprintGraph } from "./types";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

/**
 * Fetches the action blueprint graph from the mock backend.
 */
export const fetchActionBlueprintGraph = async (): Promise<RawActionBlueprintGraph> => {
  const response = await fetch(`${API_BASE_URL}/action-blueprint-graph`);

  if (!response.ok) {
    throw new Error(`Failed to load graph: ${response.status}`);
  }

  return response.json();
};
