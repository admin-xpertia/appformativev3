import type { ICase, ICompetencyProgress } from "../../../../packages/types";

interface HelloResponse {
  message: string;
}

const API_BASE_URL = "http://localhost:3001/api";

export const getHelloMessage = async (): Promise<HelloResponse> => {
  // ... (el código de esta función no cambia)
  const response = await fetch(`${API_BASE_URL}/hello`);
  if (!response.ok) throw new Error("La respuesta de la red no fue exitosa");
  return response.json();
};

export const getCases = async (): Promise<ICase[]> => {
  const response = await fetch(`${API_BASE_URL}/cases`);
  if (!response.ok) throw new Error("Error al obtener los casos");
  return response.json();
};

export const getUserProgress = async (userId: string): Promise<ICompetencyProgress[]> => {
  const response = await fetch(`${API_BASE_URL}/user/${userId}/progress`);
  if (!response.ok) throw new Error("Error al obtener el progreso del usuario");
  return response.json();
};