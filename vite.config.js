import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  // Relative, so one build works at a GitHub Pages project subpath, at a
  // custom domain root, and after a repo rename. Nothing to reconfigure.
  base: "./",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        projects: resolve(__dirname, "projects.html"),
      },
    },
  },
});
