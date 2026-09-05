import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import masterDataRoutes from "./routes/masterData.js";
import quotationRoutes from "./routes/quotations.js";
import approvalRoutes from "./routes/approvals.js";
import portalRoutes from "./routes/portal.js";
import dashboardRoutes from "./routes/dashboard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/api", masterDataRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/portal", portalRoutes);
app.use("/api/dashboard", dashboardRoutes);

const clientDir = path.join(__dirname, "..", "client");
app.use(express.static(clientDir));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`DealFlow360 running at http://localhost:${PORT}`);
});
