import pino from "pino";
import { env } from "../config/env.js";

const isDev = env.NODE_ENV === "development";

export const logger = pino({
  level: isDev ? "debug" : "info",
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
      },
    },
  }),
});

export function createModuleLogger(moduleName: string) {
  return logger.child({ module: moduleName });
}
