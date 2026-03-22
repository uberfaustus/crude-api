import test from "node:test";
import assert from "node:assert";
import Fastify from "fastify";
import { productRoutes } from "../src/routes/product.routes.js";

test("CRUD flow", async () => {
  const app = Fastify();
  app.register(productRoutes);

  await app.ready();

  let res = await app.inject({ method: "GET", url: "/api/products" });
  assert.equal(res.statusCode, 200);

  res = await app.inject({
    method: "POST",
    url: "/api/products",
    payload: {
      name: "Test",
      description: "Test desc",
      price: 100,
      category: "test",
      inStock: true,
    },
  });

  const created = JSON.parse(res.body);
  assert.equal(res.statusCode, 201);

  res = await app.inject({
    method: "GET",
    url: `/api/products/${created.id}`,
  });

  assert.equal(res.statusCode, 200);

  res = await app.inject({
    method: "DELETE",
    url: `/api/products/${created.id}`,
  });

  assert.equal(res.statusCode, 204);
});
test("GET with invalid UUID should return 400", async () => {
  const app = Fastify();
  app.register(productRoutes);

  await app.ready();

  const res = await app.inject({
    method: "GET",
    url: "/api/products/invalid-id",
  });

  assert.equal(res.statusCode, 400);
});

test("GET non-existing product should return 404", async () => {
  const app = Fastify();
  app.register(productRoutes);

  await app.ready();

  const res = await app.inject({
    method: "GET",
    url: "/api/products/123e4567-e89b-12d3-a456-426614174000",
  });

  assert.equal(res.statusCode, 404);
});
test("POST invalid product (price <= 0)", async () => {
  const app = Fastify();
  app.register(productRoutes);

  await app.ready();

  const res = await app.inject({
    method: "POST",
    url: "/api/products",
    payload: {
      name: "Bad product",
      description: "Bad product description",
      price: -100,
      category: "electronics",
      inStock: true,
    },
  });

  assert.equal(res.statusCode, 400);
});
