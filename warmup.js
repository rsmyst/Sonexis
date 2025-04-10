import https from "https";
import http from "http";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:3000";

// Function to recursively scan the app directory for routes
function scanRoutes(dir, basePath = "") {
  let routes = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    const relativePath = path.join(basePath, file);

    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file === "node_modules" || file === ".next") continue;

      // Check if this directory has a page.tsx or layout.tsx
      const hasPage =
        fs.existsSync(path.join(fullPath, "page.tsx")) ||
        fs.existsSync(path.join(fullPath, "page.js"));
      const hasLayout =
        fs.existsSync(path.join(fullPath, "layout.tsx")) ||
        fs.existsSync(path.join(fullPath, "layout.js"));

      if (hasPage || hasLayout) {
        // Convert directory path to route path and ensure it starts with /
        const routePath =
          "/" + relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
        routes.push(routePath);
      }

      // Recursively scan subdirectories
      routes = routes.concat(scanRoutes(fullPath, relativePath));
    }
  }

  return routes;
}

// Get all routes from the app directory
const appDir = path.join(process.cwd(), "app");
const ROUTES = scanRoutes(appDir);

// Add root route if not already included
if (!ROUTES.includes("/")) {
  ROUTES.unshift("/");
}

console.log("Found routes:", ROUTES);

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function checkServer() {
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    req.on("error", () => {
      resolve(false);
    });

    req.end();
  });
}

async function waitForServer(maxAttempts = 30) {
  console.log("🔥 Waiting for Next.js server to start...");

  for (let i = 0; i < maxAttempts; i++) {
    const isReady = await checkServer();
    if (isReady) {
      console.log("✅ Server is ready!");
      return true;
    }
    await delay(250);
  }

  console.log("❌ Server did not start within the expected time");
  return false;
}

async function warmupRoute(route) {
  return new Promise((resolve) => {
    // Ensure route starts with / and join with base URL properly
    const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
    const url = `${BASE_URL}${normalizedRoute}`;
    const client = url.startsWith("https") ? https : http;

    const req = client.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode === 200) {
          console.log(`✅ Warmed up: ${normalizedRoute}`);
        } else {
          console.log(
            `⚠️ Route returned ${res.statusCode}: ${normalizedRoute}`
          );
        }
        resolve();
      });
    });

    req.on("error", (error) => {
      console.error(`❌ Failed to warm up ${normalizedRoute}:`, error.message);
      resolve();
    });

    req.end();
  });
}

async function warmup() {
  const serverReady = await waitForServer();
  if (!serverReady) {
    console.log("Exiting warmup script as server is not ready");
    process.exit(1);
  }

  console.log("🔥 Starting route warmup...");
  for (const route of ROUTES) {
    await warmupRoute(route);
    await delay(500); // Add a small delay between requests
  }
  console.log("✨ Route warmup complete!");
}

warmup().catch(console.error);
