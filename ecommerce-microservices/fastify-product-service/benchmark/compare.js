const autocannon = require('autocannon');
const express = require('express');
const Fastify = require('fastify');

async function runBenchmark(url) {
  return new Promise((resolve, reject) => {
    autocannon({ url, connections: 50, duration: 5 }, (err, result) => {
      if (err) return reject(err);
      resolve({
        requests: result.requests.average,
        latency: result.latency.average,
      });
    });
  });
}

async function startExpress() {
  const app = express();
  app.get('/test', (req, res) => {
    res.json({ ok: true });
  });
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      resolve({ server, port });
    });
  });
}

async function startFastify() {
  const fastify = Fastify();
  fastify.get('/test', async () => ({ ok: true }));
  await fastify.listen({ port: 0 });
  const address = fastify.server.address();
  return { server: fastify, port: address.port };
}

(async () => {
  const expressSrv = await startExpress();
  const fastifySrv = await startFastify();

  console.log('Benchmarking Express...');
  const expressResult = await runBenchmark(`http://localhost:${expressSrv.port}/test`);
  console.log('Benchmarking Fastify...');
  const fastifyResult = await runBenchmark(`http://localhost:${fastifySrv.port}/test`);

  expressSrv.server.close();
  await fastifySrv.server.close();

  console.table({ Express: expressResult, Fastify: fastifyResult });
})();
