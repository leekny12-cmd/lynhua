import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // In-memory sync rooms (with simple file backup in /tmp/sync_rooms to persist across minor server restarts)
  const syncRooms: Record<string, { data: any; updatedAt: string }> = {};
  const BACKUP_DIR = path.join(process.cwd(), "dist", "sync_rooms");

  // Ensure backup directory exists
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
  } catch (err) {
    console.error("Failed to create sync backup directory:", err);
  }

  // Helper to generate a unique 6-digit sync code
  function generateSyncCode(): string {
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    return code;
  }

  // Load existing rooms from disk backup on startup
  try {
    if (fs.existsSync(BACKUP_DIR)) {
      const files = fs.readdirSync(BACKUP_DIR);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const code = file.replace(".json", "");
          const content = fs.readFileSync(path.join(BACKUP_DIR, file), "utf-8");
          const parsed = JSON.parse(content);
          syncRooms[code] = parsed;
        }
      }
      console.log(`Loaded ${Object.keys(syncRooms).length} sync rooms from backup.`);
    }
  } catch (err) {
    console.error("Failed to load sync rooms on startup:", err);
  }

  // API Route: Upload or Create Sync Code
  app.post("/api/sync/upload", (req, res) => {
    try {
      const { code, data } = req.body;
      let targetCode = code;

      if (!data) {
        return res.status(400).json({ success: false, message: "Dữ liệu trống!" });
      }

      // If no code, generate a unique one
      if (!targetCode) {
        let attempts = 0;
        do {
          targetCode = generateSyncCode();
          attempts++;
        } while (syncRooms[targetCode] && attempts < 10);
      }

      const updatedAt = new Date().toISOString();
      const roomPayload = { data, updatedAt };
      syncRooms[targetCode] = roomPayload;

      // Save backup on disk asynchronously
      try {
        fs.writeFileSync(
          path.join(BACKUP_DIR, `${targetCode}.json`),
          JSON.stringify(roomPayload, null, 2),
          "utf-8"
        );
      } catch (writeErr) {
        console.error(`Failed to write backup for code ${targetCode}:`, writeErr);
      }

      return res.json({
        success: true,
        code: targetCode,
        updatedAt
      });
    } catch (err: any) {
      console.error("Upload sync error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // API Route: Download Sync Data
  app.get("/api/sync/download/:code", (req, res) => {
    try {
      const { code } = req.params;
      if (!code) {
        return res.status(400).json({ success: false, message: "Mã đồng bộ không hợp lệ!" });
      }

      const room = syncRooms[code];
      if (!room) {
        return res.status(404).json({
          success: false,
          message: "Mã đồng bộ không tồn tại hoặc đã hết hạn trên máy chủ!"
        });
      }

      return res.json({
        success: true,
        data: room.data,
        updatedAt: room.updatedAt
      });
    } catch (err: any) {
      console.error("Download sync error:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
