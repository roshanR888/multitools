import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import multer from "multer";
import FormData from "form-data";
import fetch from "node-fetch";

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API Proxy for File Uploads
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    console.log("Upload request received");
    try {
      if (!req.file) {
        console.log("No file in request");
        return res.status(400).json({ success: false, description: "No file uploaded" });
      }

      console.log(`Uploading file: ${req.file.originalname} (${req.file.size} bytes)`);

      const formData = new FormData();
      formData.append("files[]", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
      });

      console.log("Forwarding to qu.ax...");
      const response = await fetch("https://qu.ax/upload.php", {
        method: "POST",
        body: formData,
        headers: formData.getHeaders(),
      });

      const responseText = await response.text();

      if (!response.ok) {
        console.error(`qu.ax error: ${response.status} ${responseText}`);
        return res.status(response.status).json({ success: false, description: "External upload failed" });
      }

      console.log("Upload response:", responseText);
      
      try {
        const data = JSON.parse(responseText);
        // qu.ax returns { success: true, files: [{ url: "...", name: "..." }] }
        if (data.success && data.files && data.files[0]) {
          res.json({
            success: true,
            link: data.files[0].url
          });
        } else {
          throw new Error("Invalid response structure from qu.ax");
        }
      } catch (e) {
        console.error("Failed to parse qu.ax response:", responseText);
        res.status(500).json({ success: false, description: "Invalid response from storage provider" });
      }
    } catch (error) {
      console.error("Proxy upload error details:", error);
      res.status(500).json({ 
        success: false, 
        description: error instanceof Error ? error.message : "Internal server error during upload proxy" 
      });
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
