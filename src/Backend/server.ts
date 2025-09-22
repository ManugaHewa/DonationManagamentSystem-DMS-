import "dotenv/config";
import express from "express";

const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "DMS API" });
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, () => {
  console.log(`DMS API ready on http://localhost:${PORT}/health`);
});
