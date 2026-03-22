import Fastify from "fastify";
import dotenv from "dotenv";
import { productRoutes } from "./routes/product.routes.js";

dotenv.config();

const app = Fastify();
app.register(productRoutes);




app.setNotFoundHandler((_, reply) => {
  reply.code(404).send({ message: "Route not found" });
});
app.setErrorHandler((error, _, reply) => {
  console.error(error);
  reply.code(500).send({ message: "Internal server error" });
});

const start = async () => {
const port = Number(process.env.PORT) || 4000;

  try {
    app.listen({ port });
    console.log(`Server running on port ${port}`);
  } catch (err) {
    process.exit(1);
  }
};

start();