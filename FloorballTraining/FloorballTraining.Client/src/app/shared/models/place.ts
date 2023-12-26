import { Environment } from "./environment";

export interface Place {
  id: number;
  name: string;
  width: number;
  length: number;
  environment: Environment;
}

