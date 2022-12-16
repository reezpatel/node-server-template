import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./graphql/**/*.graphql",
  documents: "./graphql/**/*.graphql",
  generates: {
    "./src/generated-types.ts": {
      plugins: ["typescript", "typescript-operations", "typescript-resolvers"],
      config: { constEnums: true, contextType: "./index#AppCtx" },
    },
  },
  ignoreNoDocuments: true,
  verbose: false,
};

export default config;
