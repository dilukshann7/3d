import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const blobToken = env.BLOB_READ_WRITE_TOKEN;
  const blobHost = "6k8xmfpadrzcdigl.private.blob.vercel-storage.com";

  return {
    plugins: [
      TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      {
        name: "private-blob-proxy",
        configureServer(server) {
          server.middlewares.use("/api/blob", async (req, res) => {
            if (!blobToken) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.end(
                JSON.stringify({
                  error: "Missing BLOB_READ_WRITE_TOKEN in environment",
                }),
              );
              return;
            }

            const pathPart = req.url?.split("?")[0] ?? "/";
            const fileName = decodeURIComponent(pathPart.replace(/^\//, ""));
            if (!fileName) {
              res.statusCode = 400;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Missing blob file name" }));
              return;
            }

            const upstreamUrl = `https://${blobHost}/${encodeURIComponent(fileName)}`;

            try {
              const upstream = await fetch(upstreamUrl, {
                headers: {
                  Authorization: `Bearer ${blobToken}`,
                },
              });

              res.statusCode = upstream.status;
              const contentType = upstream.headers.get("content-type");
              const contentLength = upstream.headers.get("content-length");
              const cacheControl = upstream.headers.get("cache-control");

              if (contentType) res.setHeader("Content-Type", contentType);
              if (contentLength) res.setHeader("Content-Length", contentLength);
              if (cacheControl) res.setHeader("Cache-Control", cacheControl);

              const body = Buffer.from(await upstream.arrayBuffer());
              res.end(body);
            } catch {
              res.statusCode = 502;
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify({ error: "Blob proxy request failed" }));
            }
          });
        },
      },
    ],
  };
});
