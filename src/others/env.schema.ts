import { FastifyEnvOptions } from "@fastify/env";

const schema = {
  type: "object",
  required: ["PORT"],
  properties: {
    PORT: {
      type: "number",
      default: 3000,
    },
    AUTH_SECRET: {
      type: "string",
      default: "mysupersecretpassword",
    },
  },
};

declare module "fastify" {
  interface FastifyInstance {
    config: {
      PORT: number;
      AUTH_SECRET: string;
    };
  }
}

export const fastifyEnvOptions: FastifyEnvOptions = {
  schema,
};
