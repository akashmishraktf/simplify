// Polyfill fetch for Node.js < 18 (required by @google/generative-ai)
// eslint-disable-next-line @typescript-eslint/no-var-requires
const nodeFetch = require("node-fetch");
if (!globalThis.fetch) {
  (globalThis as any).fetch = nodeFetch;
  (globalThis as any).Headers = nodeFetch.Headers;
  (globalThis as any).Request = nodeFetch.Request;
  (globalThis as any).Response = nodeFetch.Response;
}

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for browser extension
  app.enableCors({
    origin: '*', // Allow all origins for development (restrict in production)
    credentials: true,
  });

  await app.listen(3000);
  console.log('Backend running on http://localhost:3000');
}
bootstrap();
