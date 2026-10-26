import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Exported as static files and served by the Spring Boot backend; each route becomes <route>/index.html.
  output: "export",
  trailingSlash: true,
  turbopack: {
    // The repository root, so documents.json (shared with the backend) can be imported.
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
