import app from "./app";
import { connectDB } from "./config/db";
import { env } from "./config/env";

async function start() {
  await connectDB();
  app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));
}

start().catch((err) => {
  console.error("Failed to start", err);
  process.exit(1);
});
