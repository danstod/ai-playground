import "dotenv/config";
import http from "http";
import { cpus } from "os";
import cluster from "cluster";
import app from "./app.js";

const server = http.createServer(app);
const port = process.env.PORT || 3001;

if (!process.env.CLUSTER_MODE) {
  server.listen(port, () => {
    console.log(`Server started on port ${port}`);
  });

  process.on("uncaughtException", function (err) {
    console.error("uncaughtException", err);
    process.exit(1);
  });

  process.on("unhandledRejection", function (err) {
    console.error("unhandledRejection", err);
    process.exit(1);
  });
} else {
  const numCPUs = cpus().length;

  if (cluster.isMaster) {
    console.log(`Primary ${process.pid} is running`);

    // Fork workers.
    for (let i = 0; i < numCPUs; i++) {
      cluster.fork();
    }

    cluster.on("exit", () => {
      cluster.fork();
    });
  } else {
    server.listen(port, () => {
      console.log(`Server started on port ${port}`);
    });
  }

  process.on("uncaughtException", function (err) {
    console.error("uncaughtException", err);
    process.exit(1);
  });

  process.on("unhandledRejection", function (err) {
    console.error("unhandledRejection", err);
    process.exit(1);
  });
}
