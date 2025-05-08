/**
 * Função utilitária para criar um delay
 * @param ms Tempo em milissegundos
 * @returns Promise que resolve após o delay
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};