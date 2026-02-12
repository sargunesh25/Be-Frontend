var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-9DplLb/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/index.js
function generateId() {
  return crypto.randomUUID();
}
__name(generateId, "generateId");
var rateLimitStore = /* @__PURE__ */ new Map();
function checkRateLimit(ip, maxAttempts = 5, windowMs = 15 * 60 * 1e3) {
  const now = Date.now();
  const key = `login:${ip}`;
  const record = rateLimitStore.get(key);
  if (!record) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  if (now - record.firstAttempt > windowMs) {
    rateLimitStore.set(key, { attempts: 1, firstAttempt: now });
    return { allowed: true, remaining: maxAttempts - 1 };
  }
  if (record.attempts >= maxAttempts) {
    const retryAfter = Math.ceil((record.firstAttempt + windowMs - now) / 1e3);
    return { allowed: false, remaining: 0, retryAfter };
  }
  record.attempts++;
  return { allowed: true, remaining: maxAttempts - record.attempts };
}
__name(checkRateLimit, "checkRateLimit");
function resetRateLimit(ip) {
  rateLimitStore.delete(`login:${ip}`);
}
__name(resetRateLimit, "resetRateLimit");
var ALLOWED_ORIGINS = [
  "https://wild-breeze.pages.dev",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000"
];
function isAllowedOrigin(origin, env) {
  if (!origin) return false;
  const configuredOrigin = env.CORS_ORIGIN;
  if (configuredOrigin === "*") return true;
  if (configuredOrigin && origin === configuredOrigin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith(".vercel.app")) return true;
  return false;
}
__name(isAllowedOrigin, "isAllowedOrigin");
function corsHeaders(env, requestOrigin = null) {
  if (requestOrigin && isAllowedOrigin(requestOrigin, env)) {
    return {
      "Access-Control-Allow-Origin": requestOrigin,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    };
  }
  const defaultOrigin = env.CORS_ORIGIN || "https://wild-breeze.pages.dev";
  return {
    "Access-Control-Allow-Origin": defaultOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function securityHeaders() {
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-XSS-Protection": "1; mode=block",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; connect-src 'self' https://api.printful.com;",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
  };
}
__name(securityHeaders, "securityHeaders");
function jsonResponse(data, status = 200, env = {}, requestOrigin = null) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(env, requestOrigin),
      ...securityHeaders()
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400, env = {}, requestOrigin = null) {
  return jsonResponse({ error: message }, status, env, requestOrigin);
}
__name(errorResponse, "errorResponse");
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
__name(validateEmail, "validateEmail");
function validatePassword(password) {
  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters long" };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one letter" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  return { valid: true };
}
__name(validatePassword, "validatePassword");
function sanitizeString(str, maxLength = 1e3) {
  if (typeof str !== "string") return "";
  return str.slice(0, maxLength).replace(/[<>]/g, "");
}
__name(sanitizeString, "sanitizeString");
function truncateString(str, num) {
  if (!str) return "";
  if (str.length <= num) {
    return str;
  }
  return str.slice(0, num) + "...";
}
__name(truncateString, "truncateString");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 1e5,
      hash: "SHA-256"
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const combined = new Uint8Array(salt.length + hashArray.length);
  combined.set(salt);
  combined.set(hashArray, salt.length);
  return btoa(String.fromCharCode(...combined));
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, storedHash) {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(storedHash), (c) => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);
    const keyMaterial = await crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 1e5,
        hash: "SHA-256"
      },
      keyMaterial,
      256
    );
    const newHashBytes = new Uint8Array(derivedBits);
    if (newHashBytes.length !== storedHashBytes.length) return false;
    let result = 0;
    for (let i = 0; i < newHashBytes.length; i++) {
      result |= newHashBytes[i] ^ storedHashBytes[i];
    }
    return result === 0;
  } catch {
    return false;
  }
}
__name(verifyPassword, "verifyPassword");
async function createJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1e3),
    exp: Math.floor(Date.now() / 1e3) + 7 * 24 * 60 * 60
    // 7 days
  })).replace(/=/g, "");
  const signatureInput = `${headerB64}.${payloadB64}`;
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(signatureInput));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
__name(createJWT, "createJWT");
async function verifyJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split(".");
    const encoder = new TextEncoder();
    const signatureInput = `${headerB64}.${payloadB64}`;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signature = Uint8Array.from(atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
    const valid = await crypto.subtle.verify("HMAC", key, signature, encoder.encode(signatureInput));
    if (!valid) return null;
    const payload = JSON.parse(atob(payloadB64));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
__name(verifyJWT, "verifyJWT");
async function authenticateRequest(request, env) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET not configured");
    return null;
  }
  const token = authHeader.substring(7);
  return await verifyJWT(token, jwtSecret);
}
__name(authenticateRequest, "authenticateRequest");
function getClientIP(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0] || "unknown";
}
__name(getClientIP, "getClientIP");
var Router = class {
  static {
    __name(this, "Router");
  }
  constructor() {
    this.routes = [];
  }
  add(method, path, handler) {
    this.routes.push({ method, path, handler });
  }
  get(path, handler) {
    this.add("GET", path, handler);
  }
  post(path, handler) {
    this.add("POST", path, handler);
  }
  put(path, handler) {
    this.add("PUT", path, handler);
  }
  delete(path, handler) {
    this.add("DELETE", path, handler);
  }
  async handle(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;
    const requestOrigin = request.headers.get("Origin");
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          ...corsHeaders(env, requestOrigin),
          ...securityHeaders()
        }
      });
    }
    for (const route of this.routes) {
      if (route.method === method) {
        const match = this.matchPath(route.path, path);
        if (match) {
          try {
            return await route.handler(request, env, ctx, match.params, url.searchParams);
          } catch (error) {
            console.error("Route error:", error);
            return errorResponse("An error occurred", 500, env, requestOrigin);
          }
        }
      }
    }
    return errorResponse("Not found", 404, env, requestOrigin);
  }
  matchPath(pattern, path) {
    const patternParts = pattern.split("/");
    const pathParts = path.split("/");
    if (patternParts.length !== pathParts.length) return null;
    const params = {};
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(":")) {
        params[patternParts[i].substring(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }
    return { params };
  }
};
var router = new Router();
router.post("/api/auth/register", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400, env, requestOrigin);
  }
  const { email, password, firstName, lastName } = body;
  if (!email || !validateEmail(email)) {
    return errorResponse("Valid email is required", 400, env, requestOrigin);
  }
  if (!password) {
    return errorResponse("Password is required", 400, env, requestOrigin);
  }
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return errorResponse(passwordValidation.message, 400, env, requestOrigin);
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (existing) {
    return errorResponse("Email already registered", 400, env, requestOrigin);
  }
  const id = generateId();
  const passwordHash = await hashPassword(password);
  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, email.toLowerCase(), passwordHash, sanitizeString(firstName || ""), sanitizeString(lastName || "")).run();
  return jsonResponse({ id, email: email.toLowerCase() }, 201, env, requestOrigin);
});
router.post("/api/auth/login", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  const clientIP = getClientIP(request);
  const rateLimit = checkRateLimit(clientIP);
  if (!rateLimit.allowed) {
    return jsonResponse(
      { error: "Too many login attempts. Please try again later." },
      429,
      env,
      requestOrigin
    );
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400, env, requestOrigin);
  }
  const { email, password } = body;
  if (!email || !password) {
    return errorResponse("Email and password are required", 400, env, requestOrigin);
  }
  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first();
  if (!user) {
    return errorResponse("Invalid credentials", 401, env, requestOrigin);
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return errorResponse("Invalid credentials", 401, env, requestOrigin);
  }
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("CRITICAL: JWT_SECRET not configured");
    return errorResponse("Authentication service unavailable", 503, env, requestOrigin);
  }
  resetRateLimit(clientIP);
  const token = await createJWT({ userId: user.id, email: user.email }, jwtSecret);
  return jsonResponse({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    }
  }, 200, env, requestOrigin);
});
router.get("/api/products", async (request, env, ctx, params, query) => {
  const requestOrigin = request.headers.get("Origin");
  let products = await env.DB.prepare("SELECT * FROM products ORDER BY created_at DESC").all();
  let results = products.results || [];
  const availability = query.get("availability");
  if (availability === "in_stock") {
    results = results.filter((p) => p.is_available === 1);
  } else if (availability === "out_of_stock") {
    results = results.filter((p) => p.is_available === 0);
  }
  const category = query.get("category");
  if (category) {
    results = results.filter((p) => p.category === category);
  }
  const minPrice = query.get("min_price");
  if (minPrice) {
    results = results.filter((p) => parseFloat(p.price) >= parseFloat(minPrice));
  }
  const maxPrice = query.get("max_price");
  if (maxPrice) {
    results = results.filter((p) => parseFloat(p.price) <= parseFloat(maxPrice));
  }
  const sort = query.get("sort");
  if (sort === "price_asc") {
    results.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sort === "price_desc") {
    results.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  } else if (sort === "alphabetical_az") {
    results.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sort === "alphabetical_za") {
    results.sort((a, b) => b.title.localeCompare(a.title));
  }
  results = results.map((p) => ({
    ...p,
    is_available: p.is_available === 1,
    is_sale: p.is_sale === 1
  }));
  return jsonResponse(results, 200, env, requestOrigin);
});
router.get("/api/hero-slides", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  const slides = await env.DB.prepare(
    "SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC"
  ).all();
  const results = (slides.results || []).map((s) => ({
    ...s,
    is_active: s.is_active === 1
  }));
  return jsonResponse(results, 200, env, requestOrigin);
});
router.get("/api/faqs", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  const faqs = await env.DB.prepare("SELECT * FROM faqs ORDER BY sort_order ASC").all();
  return jsonResponse(faqs.results || [], 200, env, requestOrigin);
});
router.post("/api/contact", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400, env, requestOrigin);
  }
  const { name, email, message } = body;
  if (!message || message.trim().length === 0) {
    return errorResponse("Message is required", 400, env, requestOrigin);
  }
  if (email && !validateEmail(email)) {
    return errorResponse("Invalid email format", 400, env, requestOrigin);
  }
  const id = generateId();
  await env.DB.prepare(
    "INSERT INTO contact_messages (id, name, email, message) VALUES (?, ?, ?, ?)"
  ).bind(id, sanitizeString(name || ""), email || "", sanitizeString(message)).run();
  return jsonResponse({ success: true, message: "Message received" }, 201, env, requestOrigin);
});
router.get("/api/cart", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401, env, requestOrigin);
  }
  const cartItems = await env.DB.prepare(`
        SELECT id, quantity, product_id, title, price, image_url, selected_size, selected_color, created_at
        FROM cart_items
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).bind(user.userId).all();
  return jsonResponse(cartItems.results || [], 200, env, requestOrigin);
});
router.post("/api/cart", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401, env, requestOrigin);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400, env, requestOrigin);
  }
  const { productId, quantity = 1, title, price, imageUrl, selectedSize, selectedColor } = body;
  console.log("Add to cart:", body);
  if (!productId) {
    return errorResponse("Product ID is required", 400, env, requestOrigin);
  }
  const existing = await env.DB.prepare(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ? AND (selected_size = ? OR selected_size IS NULL) AND (selected_color = ? OR selected_color IS NULL)"
  ).bind(user.userId, productId.toString(), selectedSize || null, selectedColor || null).first();
  if (existing) {
    await env.DB.prepare(
      "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?"
    ).bind(quantity, existing.id).run();
    return jsonResponse({ id: existing.id, quantity: existing.quantity + quantity }, 200, env, requestOrigin);
  } else {
    const id = generateId();
    await env.DB.prepare(
      "INSERT INTO cart_items (id, user_id, product_id, quantity, title, price, image_url, selected_size, selected_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(
      id,
      user.userId,
      productId.toString(),
      quantity,
      truncateString(title, 255),
      price || 0,
      imageUrl || "",
      selectedSize || null,
      selectedColor || null
    ).run();
    return jsonResponse({ id, productId, quantity, title, price, imageUrl, selectedSize, selectedColor }, 201, env, requestOrigin);
  }
});
router.delete("/api/cart/:productId", async (request, env, ctx, params) => {
  const requestOrigin = request.headers.get("Origin");
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401, env, requestOrigin);
  }
  await env.DB.prepare(
    "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?"
  ).bind(user.userId, params.productId).run();
  return jsonResponse({ message: "Item removed" }, 200, env, requestOrigin);
});
router.post("/api/cart/merge", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401, env, requestOrigin);
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400, env, requestOrigin);
  }
  const { guestCart } = body;
  if (Array.isArray(guestCart)) {
    for (const item of guestCart) {
      if (!item.product_id) continue;
      const existing = await env.DB.prepare(
        "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?"
      ).bind(user.userId, item.product_id.toString()).first();
      if (existing) {
        await env.DB.prepare(
          "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?"
        ).bind(item.quantity || 1, existing.id).run();
      } else {
        const id = generateId();
        await env.DB.prepare(
          "INSERT INTO cart_items (id, user_id, product_id, quantity, title, price, image_url, selected_size, selected_color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
          id,
          user.userId,
          item.product_id.toString(),
          item.quantity || 1,
          truncateString(item.title, 255),
          item.price || 0,
          item.image_url || "",
          item.selectedSize || null,
          item.selectedColor || null
        ).run();
      }
    }
  }
  const cartItems = await env.DB.prepare(`
        SELECT id, quantity, product_id, title, price, image_url, selected_size, selected_color, created_at
        FROM cart_items
        WHERE user_id = ?
        ORDER BY created_at DESC
    `).bind(user.userId).all();
  return jsonResponse(cartItems.results || [], 200, env, requestOrigin);
});
router.post("/api/subscribe", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  let body;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body", 400, env, requestOrigin);
  }
  const { phoneNumber } = body;
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return errorResponse("Phone number is required", 400, env, requestOrigin);
  }
  const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
  if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
    return errorResponse("Invalid phone number format", 400, env, requestOrigin);
  }
  const existing = await env.DB.prepare(
    "SELECT id FROM discount_signups WHERE phone_number = ?"
  ).bind(cleanPhone).first();
  if (!existing) {
    const id = generateId();
    await env.DB.prepare(
      "INSERT INTO discount_signups (id, phone_number) VALUES (?, ?)"
    ).bind(id, cleanPhone).run();
  }
  return jsonResponse({ message: "Discount activated!", discountActive: true }, 200, env, requestOrigin);
});
router.get("/api/printful/products", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  const printfulToken = env.PRINTFUL_API_TOKEN;
  if (!printfulToken) {
    return errorResponse("Printful API not configured", 500, env, requestOrigin);
  }
  try {
    const productsResponse = await fetch("https://api.printful.com/store/products", {
      headers: {
        "Authorization": `Bearer ${printfulToken}`,
        "Content-Type": "application/json"
      }
    });
    const productsData = await productsResponse.json();
    const storeProducts = productsData.result || [];
    const productsWithDetails = await Promise.all(
      storeProducts.map(async (product) => {
        try {
          const detailsResponse = await fetch(`https://api.printful.com/store/products/${product.id}`, {
            headers: {
              "Authorization": `Bearer ${printfulToken}`,
              "Content-Type": "application/json"
            }
          });
          const detailsData = await detailsResponse.json();
          const details = detailsData.result;
          if (!details) return null;
          const variants = details.sync_variants || [];
          const firstVariant = variants[0];
          const price = firstVariant?.retail_price || "0.00";
          return {
            id: product.id.toString(),
            title: product.name,
            image_url: product.thumbnail_url,
            price: parseFloat(price).toFixed(2),
            is_available: true,
            is_sale: false,
            original_price: null,
            printful_id: product.id,
            external_id: product.external_id,
            variants: variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: v.retail_price,
              sku: v.sku
            }))
          };
        } catch {
          return null;
        }
      })
    );
    const products = productsWithDetails.filter((p) => p !== null);
    return jsonResponse({ products }, 200, env, requestOrigin);
  } catch (error) {
    console.error("Printful API error:", error);
    return errorResponse("Failed to fetch products", 500, env, requestOrigin);
  }
});
router.get("/api/health", async (request, env) => {
  const requestOrigin = request.headers.get("Origin");
  return jsonResponse({
    status: "ok",
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    version: "2.0.0"
  }, 200, env, requestOrigin);
});
var src_default = {
  async fetch(request, env, ctx) {
    return router.handle(request, env, ctx);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-9DplLb/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-9DplLb/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
