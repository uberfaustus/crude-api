import type { FastifyInstance } from "fastify";
import { v4 as uuidv4 } from "uuid";

import { productSchema } from "../utils/productSchema.js";
import { validateUUID } from "../utils/validator.js";
import { products } from "../db.js";

export async function productRoutes(fastify: FastifyInstance) {
  fastify.get("/api/products", async (_, reply) => {
    return reply.code(200).send(products);
  });

  fastify.get("/api/products/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    if (!validateUUID(id)) {
      return reply.code(400).send({ message: "Invalid productId" });
    }

    const product = products.find((p) => p.id === id);

    if (!product) {
      return reply.code(404).send({ message: "Product not found" });
    }

    return reply.send(product);
  });

  fastify.post("/api/products", async (req, reply) => {
    const parse = productSchema.safeParse(req.body);

    if (!parse.success) {
      return reply.code(400).send({ message: "Invalid body" });
    }

    const newProduct = {
      id: uuidv4(),
      ...parse.data,
    };

    products.push(newProduct);

    return reply.code(201).send(newProduct);
  });

  fastify.put("/api/products/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    if (!validateUUID(id)) {
      return reply.code(400).send({ message: "Invalid productId" });
    }

    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return reply.code(404).send({ message: "Product not found" });
    }

    const parse = productSchema.safeParse(req.body);

    if (!parse.success) {
      return reply.code(400).send({ message: "Invalid body" });
    }

    products[index] = { id, ...parse.data };

    return reply.send(products[index]);
  });

  // DELETE
  fastify.delete("/api/products/:id", async (req, reply) => {
    const { id } = req.params as { id: string };

    if (!validateUUID(id)) {
      return reply.code(400).send({ message: "Invalid productId" });
    }

    const index = products.findIndex((p) => p.id === id);

    if (index === -1) {
      return reply.code(404).send({ message: "Product not found" });
    }

    products.splice(index, 1);

    return reply.code(204).send();
  });
}
