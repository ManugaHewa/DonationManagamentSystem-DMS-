import "dotenv/config";
import express from "express";
import donationsRouter from "./routes/donation";
import { notFound, errorHandler } from "./middleware/error";
import { log } from "./utils/logger";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "DMS API" });
});

app.use("/api/v1/donations", donationsRouter);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  log.info(`DMS API ready on http://localhost:${PORT}/health`);
});
