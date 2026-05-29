import 'dotenv/config';
import { buildServer } from './app';

const port = Number(process.env.API_PORT ?? 5174);
const host = process.env.API_HOST ?? '0.0.0.0';
const app = buildServer();

await app.listen({ port, host });
