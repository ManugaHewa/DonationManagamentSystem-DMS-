import { Router } from "express";
import { AppError } from "../middleware/error";

const router = Router();

router.get("/", (_req, res) => {
  const items = [
    { id: "d_001", donor: "Alice", amount: 50, currency: "CAD" },
    { id: "d_002", donor: "Bob", amount: 25, currency: "CAD" },
  ];
  res.json({ ok: true, items });
});

router.get("/:id", (req, res, next) => {
  const { id } = req.params;
  if (id === "d_404") {
    return next(new AppError("Donation not found", 404));
  }
  res.json({ ok: true, item: { id, donor: "Sample", amount: 10, currency: "CAD" } });
});

export default router;
