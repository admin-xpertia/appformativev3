// src/services/api.service.ts
import type { ICase, ICompetencyProgress, CaseSlug } from "../../../../packages/types";

const API_BASE_URL = "http://localhost:3001/api";

export const getCases = async (): Promise<ICase[]> => {
  const response = await fetch(`${API_BASE_URL}/cases`);
  if (!response.ok) throw new Error("Error al obtener los casos");
  const data = (await response.json()) as Array<{
    id: { tb: string; id: string } | string;
    slug: CaseSlug;
    title: string;
  }>;

  return data.map((c) => {
    // Extraemos el string real del RecordId
    const rawId = typeof c.id === "object" ? c.id.id : c.id;
    // Ahora castea ambos al tipo CaseSlug
    const slug  = c.slug as CaseSlug;
    const id    = rawId as CaseSlug;

    return {
      id,
      slug,
      title: c.title,
      available: true,
      progress: 0,
    };
  });
};

export const getUserProgress = async (
  userId: string
): Promise<ICompetencyProgress[]> => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/progress`);
  if (!response.ok) throw new Error("Error al obtener el progreso del usuario");
  return response.json();
};
