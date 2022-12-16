import { fastify, FastifyRequest, FastifyReply } from "fastify";
import { fastifyEnv } from "@fastify/env";
import { createYoga, YogaInitialContext } from "graphql-yoga";
import { fastifyEnvOptions } from "./others/env.schema";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { mergeResolvers, mergeTypeDefs } from "@graphql-tools/merge";
import { loadFilesSync } from "@graphql-tools/load-files";
import { join } from "path";
import { prisma } from "./others/prisma";

const app = fastify();

app.register(fastifyEnv, fastifyEnvOptions);

app.decorate("prisma", prisma);

const yoga = createYoga<{
  req: FastifyRequest;
  reply: FastifyReply;
}>({
  schema: makeExecutableSchema({
    typeDefs: mergeTypeDefs(
      loadFilesSync(join(__dirname, "..", "graphql", "/**/*.graphql"))
    ),

    resolvers: mergeResolvers(
      loadFilesSync(join(__dirname, "..", "build", "gql")) as never
    ) as never,
  }),
  logging: {
    debug: (...args) => args.forEach((arg) => app.log.debug(arg)),
    info: (...args) => args.forEach((arg) => app.log.info(arg)),
    warn: (...args) => args.forEach((arg) => app.log.warn(arg)),
    error: (...args) => args.forEach((arg) => app.log.error(arg)),
  },
  context: { app },
});

app.route({
  url: "/graphql",
  method: ["GET", "POST", "OPTIONS"],
  handler: async (req, reply) => {
    const response = await yoga.handleNodeRequest(req, {
      req,
      reply,
    });

    response.headers.forEach((value, key) => {
      reply.header(key, value);
    });

    reply.status(response.status);

    reply.send(response.body);

    return reply;
  },
});

app.ready().then(() => {
  app
    .listen({ port: app.config.PORT, host: "0.0.0.0" })
    .then((res) => {
      console.log(`Server is listening at ${res}`);
    })
    .catch((e) => {
      console.error("Failed to start server");
      console.error(e);
    });
});

export type AppCtx = {
  config: Pick<typeof app, "config">;
  req: FastifyRequest;
  reply: FastifyReply;
  app: typeof app;
} & YogaInitialContext;
