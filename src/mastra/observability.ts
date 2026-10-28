import { MastraStorageExporter, Observability, SensitiveDataFilter } from "@mastra/observability";

const OBSERVABILITY_SERVICE_NAME = "nexo-assist";

export const observability = new Observability({
  configs: {
    default: {
      serviceName: OBSERVABILITY_SERVICE_NAME,
      exporters: [new MastraStorageExporter()],
      spanOutputProcessors: [new SensitiveDataFilter()],
    },
  },
});
