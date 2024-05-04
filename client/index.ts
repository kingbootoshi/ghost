import dotenv from 'dotenv';
import { SoulGateway } from './soulGateway.js';

dotenv.config();

const gateway = new SoulGateway();

gateway.start();

process.on('SIGINT', async () => {
  console.warn("stopping");
  await gateway.stop();
  process.exit(0);
});``