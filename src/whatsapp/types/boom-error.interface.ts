/**
 * Interface para representar o payload de saída de erros do tipo Boom
 */
export interface BoomErrorOutput {
  statusCode: number;
  payload: {
    message?: string;
    data?: any;
  };
  content?: any[];
}

/**
 * Interface para erros do tipo Boom
 */
export interface BoomError extends Error {
  isBoom: boolean;
  isServer: boolean;
  data?: any;
  output: BoomErrorOutput;
}
