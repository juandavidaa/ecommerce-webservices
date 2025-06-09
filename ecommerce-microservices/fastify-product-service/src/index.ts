import Fastify from 'fastify';
import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const fastify = Fastify({ logger: true });

fastify.get('/health', async () => {
  return {
    status: 'UP',
    service: 'Product Service (Fastify)',
    timestamp: new Date().toISOString(),
  };
});

fastify.get('/api/v1/products', async () => {
  return [{ id: 1, name: 'Example Product' }];
});

const start = async () => {
  try {
    const port = parseInt(process.env.PRODUCT_SERVICE_PORT || '3003', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    fastify.log.info(`Fastify Product Service running on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
