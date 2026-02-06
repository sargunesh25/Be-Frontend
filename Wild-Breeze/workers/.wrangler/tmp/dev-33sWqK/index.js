var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-ucMwbR/checked-fetch.js
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
function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(),
      ...headers
    }
  });
}
__name(jsonResponse, "jsonResponse");
function errorResponse(message, status = 400) {
  return jsonResponse({ error: message }, status);
}
__name(errorResponse, "errorResponse");
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "wild-breeze-salt");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
__name(hashPassword, "hashPassword");
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}
__name(verifyPassword, "verifyPassword");
async function createJWT(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "");
  const payloadB64 = btoa(JSON.stringify({
    ...payload,
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
  const token = authHeader.substring(7);
  const jwtSecret = env.JWT_SECRET || "default-dev-secret";
  return await verifyJWT(token, jwtSecret);
}
__name(authenticateRequest, "authenticateRequest");
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
    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    for (const route of this.routes) {
      if (route.method === method) {
        const match = this.matchPath(route.path, path);
        if (match) {
          try {
            return await route.handler(request, env, ctx, match.params, url.searchParams);
          } catch (error) {
            console.error("Route error:", error);
            return errorResponse("Internal server error", 500);
          }
        }
      }
    }
    return errorResponse("Not found", 404);
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
  const { email, password, firstName, lastName } = await request.json();
  if (!email || !password) {
    return errorResponse("Email and password are required");
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return errorResponse("Email already registered");
  }
  const id = generateId();
  const passwordHash = await hashPassword(password);
  await env.DB.prepare(
    "INSERT INTO users (id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)"
  ).bind(id, email, passwordHash, firstName || "", lastName || "").run();
  return jsonResponse({ id, email }, 201);
});
router.post("/api/auth/login", async (request, env) => {
  const { email, password } = await request.json();
  if (!email || !password) {
    return errorResponse("Email and password are required");
  }
  const user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
  if (!user) {
    return errorResponse("Invalid credentials", 401);
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    return errorResponse("Invalid credentials", 401);
  }
  const jwtSecret = env.JWT_SECRET || "default-dev-secret";
  const token = await createJWT({ userId: user.id, email: user.email }, jwtSecret);
  return jsonResponse({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    }
  });
});
router.get("/api/products", async (request, env, ctx, params, query) => {
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
  return jsonResponse(results);
});
router.get("/api/hero-slides", async (request, env) => {
  const slides = await env.DB.prepare(
    "SELECT * FROM hero_slides WHERE is_active = 1 ORDER BY sort_order ASC"
  ).all();
  const results = (slides.results || []).map((s) => ({
    ...s,
    is_active: s.is_active === 1
  }));
  return jsonResponse(results);
});
router.get("/api/faqs", async (request, env) => {
  const faqs = await env.DB.prepare("SELECT * FROM faqs ORDER BY sort_order ASC").all();
  return jsonResponse(faqs.results || []);
});
router.post("/api/contact", async (request, env) => {
  const { name, email, message } = await request.json();
  const id = generateId();
  await env.DB.prepare(
    "INSERT INTO contact_messages (id, name, email, message) VALUES (?, ?, ?, ?)"
  ).bind(id, name || "", email || "", message || "").run();
  return jsonResponse({ success: true, message: "Message received" }, 201);
});
router.get("/api/cart", async (request, env) => {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }
  const cartItems = await env.DB.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id, p.title, p.price, p.image_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).bind(user.userId).all();
  return jsonResponse(cartItems.results || []);
});
router.post("/api/cart", async (request, env) => {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }
  const { productId, quantity = 1 } = await request.json();
  const existing = await env.DB.prepare(
    "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?"
  ).bind(user.userId, productId.toString()).first();
  if (existing) {
    await env.DB.prepare(
      "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?"
    ).bind(quantity, existing.id).run();
    return jsonResponse({ id: existing.id, quantity: existing.quantity + quantity });
  } else {
    const id = generateId();
    await env.DB.prepare(
      "INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)"
    ).bind(id, user.userId, productId.toString(), quantity).run();
    return jsonResponse({ id, productId, quantity }, 201);
  }
});
router.delete("/api/cart/:productId", async (request, env, ctx, params) => {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }
  await env.DB.prepare(
    "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?"
  ).bind(user.userId, params.productId).run();
  return jsonResponse({ message: "Item removed" });
});
router.post("/api/cart/merge", async (request, env) => {
  const user = await authenticateRequest(request, env);
  if (!user) {
    return errorResponse("Unauthorized", 401);
  }
  const { guestCart } = await request.json();
  if (Array.isArray(guestCart)) {
    for (const item of guestCart) {
      const existing = await env.DB.prepare(
        "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?"
      ).bind(user.userId, item.product_id.toString()).first();
      if (existing) {
        await env.DB.prepare(
          "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?"
        ).bind(item.quantity, existing.id).run();
      } else {
        const id = generateId();
        await env.DB.prepare(
          "INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES (?, ?, ?, ?)"
        ).bind(id, user.userId, item.product_id.toString(), item.quantity).run();
      }
    }
  }
  const cartItems = await env.DB.prepare(`
        SELECT ci.id, ci.quantity, ci.product_id, p.title, p.price, p.image_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?
    `).bind(user.userId).all();
  return jsonResponse(cartItems.results || []);
});
router.post("/api/subscribe", async (request, env) => {
  const { phoneNumber } = await request.json();
  if (!phoneNumber) {
    return errorResponse("Phone number is required");
  }
  const existing = await env.DB.prepare(
    "SELECT id FROM discount_signups WHERE phone_number = ?"
  ).bind(phoneNumber).first();
  if (!existing) {
    const id = generateId();
    await env.DB.prepare(
      "INSERT INTO discount_signups (id, phone_number) VALUES (?, ?)"
    ).bind(id, phoneNumber).run();
  }
  return jsonResponse({ message: "Discount activated!", discountActive: true });
});
router.get("/api/printful/products", async (request, env) => {
  const printfulToken = env.PRINTFUL_API_TOKEN;
  if (!printfulToken) {
    return errorResponse("Printful API not configured", 500);
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
    return jsonResponse({ products });
  } catch (error) {
    return errorResponse("Failed to fetch Printful products", 500);
  }
});
router.get("/api/health", async () => {
  return jsonResponse({ status: "ok", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
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

// .wrangler/tmp/bundle-ucMwbR/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-ucMwbR/middleware-loader.entry.ts
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
