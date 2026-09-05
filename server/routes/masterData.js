import { Router } from "express";
import { db } from "../store.js";

const router = Router();

router.get("/customers", (req, res) => {
  res.json(db.customers);
});

router.get("/products", (req, res) => {
  res.json(db.products);
});

router.get("/warehouses", (req, res) => {
  res.json(db.warehouses);
});

export default router;
