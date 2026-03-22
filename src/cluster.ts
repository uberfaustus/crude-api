import cluster from "node:cluster";
import os from "node:os";
import http from "node:http";
import { v4 as uuidv4 } from "uuid";

const PORT = Number(process.env.PORT) || 4000;
const numCPUs = os.availableParallelism() - 1;

const products: any[] = [];

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} running`);


  const workers: number[] = [];

  for (let i = 0; i < numCPUs; i++) {
    const port = PORT + i + 1;

    const worker = cluster.fork({
      WORKER_PORT: port,
    });

    workers.push(port);

    worker.on("message", async (msg: any) => {
      const { type, payload, requestId } = msg;

      let result: any;
      let error: any;

      try {
        switch (type) {
          case "GET_ALL":
            result = products;
            break;

          case "GET_ONE":
            result = products.find((p) => p.id === payload.id);
            break;

          case "CREATE":
            const newProduct = { id: uuidv4(), ...payload };
            products.push(newProduct);
            result = newProduct;
            break;

          case "UPDATE":
            const index = products.findIndex((p) => p.id === payload.id);
            if (index === -1) throw new Error("NOT_FOUND");

            products[index] = { id: payload.id, ...payload.data };
            result = products[index];
            break;

          case "DELETE":
            const idx = products.findIndex((p) => p.id === payload.id);
            if (idx === -1) throw new Error("NOT_FOUND");

            products.splice(idx, 1);
            result = true;
            break;
        }
      } catch (e: any) {
        error = e.message;
      }

      worker.send({ requestId, result, error });
    });
  }

  let current = 0;

  const server = http.createServer((req, res) => {
    const targetPort = workers[current];
    current = (current + 1) % workers.length;

    const proxy = http.request(
      {
        hostname: "localhost",
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
        proxyRes.pipe(res);
      },
    );

    req.pipe(proxy);
  });

  server.listen(PORT, () => {
    console.log(`Load balancer running on ${PORT}`);
  });
} else {
  await import("./server-worker.js");
}
