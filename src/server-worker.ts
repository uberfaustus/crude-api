import Fastify from "fastify";
import { validateUUID } from "./utils/validator.js";
import { productSchema } from "./utils/productSchema.js";

const app = Fastify();
const port = Number(process.env.WORKER_PORT);

let requestId = 0;
const pending = new Map();

process.on("message", (msg: any) => {
  const { requestId, result, error } = msg;

  const resolve = pending.get(requestId);
  if (resolve) {
    resolve({ result, error });
    pending.delete(requestId);
  }
});

function sendToMaster(
  type: string,
  payload?: any,
): Promise<{ result?: any; error?: any }> {
  return new Promise((resolve) => {
    const id = requestId++;

    pending.set(id, resolve);

    process.send?.({
      type,
      payload,
      requestId: id,
    });
  });
}



app.get("/api/products", async () => {
  const { result } = await sendToMaster("GET_ALL");
  return result;
});

app.get("/api/products/:id", async (req, reply) => {
  const { id } = req.params as any;

  if (!validateUUID(id)) {
    return reply.code(400).send({ message: "Invalid productId" });
  }

  const { result } = await sendToMaster("GET_ONE", { id });

  if (!result) {
    return reply.code(404).send({ message: "Product not found" });
  }

  return result;
});

app.post("/api/products", async (req, reply) => {
  const parse = productSchema.safeParse(req.body);

  if (!parse.success) {
    return reply.code(400).send({ message: "Invalid body" });
  }

  const { result } = await sendToMaster("CREATE", parse.data);

  return reply.code(201).send(result);
});

app.put("/api/products/:id", async (req, reply) => {
  const { id } = req.params as any;

  if (!validateUUID(id)) {
    return reply.code(400).send({ message: "Invalid productId" });
  }

  const parse = productSchema.safeParse(req.body);

  if (!parse.success) {
    return reply.code(400).send({ message: "Invalid body" });
  }

  const { result, error } = await sendToMaster("UPDATE", {
    id,
    data: parse.data,
  });

  if (error === "NOT_FOUND") {
    return reply.code(404).send({ message: "Product not found" });
  }

  return result;
});

app.delete("/api/products/:id", async (req, reply) => {
  const { id } = req.params as any;

  if (!validateUUID(id)) {
    return reply.code(400).send({ message: "Invalid productId" });
  }

  const { error } = await sendToMaster("DELETE", { id });

  if (error === "NOT_FOUND") {
    return reply.code(404).send({ message: "Product not found" });
  }

  return reply.code(204).send();
});


app.setNotFoundHandler((_, reply) => {
  reply.code(404).send({ message: "Route not found" });
});

app.setErrorHandler((err, _, reply) => {
  console.error(err);
  reply.code(500).send({ message: "Internal server error" });
});

app.listen({ port }, () => {
  console.log(`Worker running on ${port}`);
});
