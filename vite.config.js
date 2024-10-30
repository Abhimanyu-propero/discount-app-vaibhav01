// import { vitePlugin as remix } from "@remix-run/dev";
// import { defineConfig } from "vite";
// import tsconfigPaths from "vite-tsconfig-paths";

// // Related: https://github.com/remix-run/remix/issues/2835#issuecomment-1144102176
// // Replace the HOST env var with SHOPIFY_APP_URL so that it doesn't break the remix server. The CLI will eventually
// // stop passing in HOST, so we can remove this workaround after the next major release.
// if (
//   process.env.HOST &&
//   (!process.env.SHOPIFY_APP_URL ||
//     process.env.SHOPIFY_APP_URL === process.env.HOST)
// ) {
//   process.env.SHOPIFY_APP_URL = process.env.HOST;
//   delete process.env.HOST;
// }

// const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
//   .hostname;
// let hmrConfig;

// if (host === "localhost") {
//   hmrConfig = {
//     protocol: "ws",
//     host: "localhost",
//     port: 64999,
//     clientPort: 64999,
//   };
// } else {
//   hmrConfig = {
//     protocol: "wss",
//     host: host,
//     port: parseInt(process.env.FRONTEND_PORT) || 8002,
//     clientPort: 443,
//   };
// }

// export default defineConfig({
//   server: {
//     port: Number(process.env.PORT || 3000),
//     hmr: hmrConfig,
//     fs: {
//       // See https://vitejs.dev/config/server-options.html#server-fs-allow for more information
//       allow: ["app", "node_modules"],
//     },
//   },
//   plugins: [
//     remix({
//       ignoredRouteFiles: ["**/.*"],
//     }),
//     tsconfigPaths(),
//   ],
//   build: {
//     assetsInlineLimit: 0,
//   },
// });

// import { vitePlugin as remix } from "@remix-run/dev";
// import { defineConfig } from "vite";
// import { installGlobals } from "@remix-run/node";
// import "dotenv/config";
// import tsconfigPaths from "vite-tsconfig-paths";
// if (
//   process.env.HOST &&
//   (!process.env.SHOPIFY_APP_URL ||
//     process.env.SHOPIFY_APP_URL === process.env.HOST)
// ) {
//   process.env.SHOPIFY_APP_URL = process.env.HOST;
//   delete process.env.HOST;
// }

// const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
//   .hostname;
// let hmrConfig;

// if (host === "localhost") {
//   hmrConfig = {
//     protocol: "ws",
//     host: "localhost",
//     port: 64999,
//     clientPort: 64999,
//   };
// } else {
//   hmrConfig = {
//     protocol: "wss",
//     host: host,
//     port: parseInt(process.env.FRONTEND_PORT) || 8002,
//     clientPort: 443,
//   };
// }

// export default defineConfig({
//   server: {
//     port: Number(process.env.PORT || 3000),
//     hmr: hmrConfig,
//     fs: {
//       allow: ["app", "node_modules"],
//     },
//   },
//   plugins: [
//     remix({
//       ignoredRouteFiles: ["**/.*"],
//     }),
//     tsconfigPaths(),
//   ],
//   build: {
//     assetsInlineLimit: 0,
//   },
// });

import { vitePlugin as remix } from "@remix-run/dev";
import { installGlobals } from "@remix-run/node";
import "dotenv/config";
import { flatRoutes } from "remix-flat-routes";
import { defineConfig } from "vite";
import jsconfigPaths from "vite-jsconfig-paths";

installGlobals();

export default defineConfig({
  define: {
    SHOPIFY_API_KEY: JSON.stringify(
      process.env.SHOPIFY_API_KEY || "cannot read process"
    ),
  },
  server: {
    port: parseInt(process.env.PORT || 3000),
    fs: {
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: ["**/.*"],
        });
      },
    }),
    jsconfigPaths(),
  ],
});
