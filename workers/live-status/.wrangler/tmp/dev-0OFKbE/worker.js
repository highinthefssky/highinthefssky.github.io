var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-74bqQY/checked-fetch.js
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

// worker.js
var CACHE_KEY = "live-status";
var CACHE_TTL_SECONDS = 300;
var worker_default = {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return handleCORS(env);
    }
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    const origin = request.headers.get("Origin");
    const allowedOrigin = env.ALLOWED_ORIGIN || "https://highintheflightsimsky.nl";
    const allowLocalhost = env.ALLOW_LOCALHOST === "true";
    const isAllowed = origin === allowedOrigin || allowLocalhost && (origin?.startsWith("http://localhost:") || origin?.startsWith("http://127.0.0.1:"));
    if (!origin || !isAllowed) {
      return new Response("Forbidden", { status: 403 });
    }
    try {
      const liveStatus = await getCachedLiveStatus(env, ctx);
      return new Response(JSON.stringify(liveStatus), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin || allowedOrigin,
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Max-Age": "86400",
          // Client-side cache matches KV TTL
          "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`
        }
      });
    } catch (error) {
      console.error("Error checking live status:", error);
      return new Response(JSON.stringify({
        isLive: false,
        error: "Failed to check live status"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": origin || allowedOrigin
        }
      });
    }
  }
};
async function getCachedLiveStatus(env, ctx) {
  if (env.LIVE_STATUS_CACHE) {
    const cached = await env.LIVE_STATUS_CACHE.get(CACHE_KEY, { type: "json" });
    if (cached !== null) {
      return cached;
    }
  }
  const liveStatus = await checkLiveStatus(env);
  if (env.LIVE_STATUS_CACHE) {
    ctx.waitUntil(
      env.LIVE_STATUS_CACHE.put(CACHE_KEY, JSON.stringify(liveStatus), {
        expirationTtl: CACHE_TTL_SECONDS
      })
    );
  }
  return liveStatus;
}
__name(getCachedLiveStatus, "getCachedLiveStatus");
async function checkLiveStatus(env) {
  const { YOUTUBE_CHANNEL_ID } = env;
  if (!YOUTUBE_CHANNEL_ID) {
    throw new Error("Missing YOUTUBE_CHANNEL_ID environment variable");
  }
  const liveUrl = `https://www.youtube.com/channel/${YOUTUBE_CHANNEL_ID}/live`;
  const response = await fetch(liveUrl, {
    headers: {
      // Request English to ensure consistent parsing of status text
      "Accept-Language": "en-US,en;q=0.9",
      "User-Agent": "Mozilla/5.0 (compatible; LiveStatusBot/1.0)"
    },
    redirect: "follow"
  });
  if (!response.ok) {
    throw new Error(`YouTube page fetch error: ${response.status}`);
  }
  const html = await response.text();
  const isLive = html.includes('"isLive":true') || html.includes('"isLiveContent":true');
  if (!isLive || html.includes('"LIVE_STREAM_OFFLINE"')) {
    if (!isLive) {
      return { isLive: false };
    }
    if (!html.includes('"isLive":true')) {
      return { isLive: false };
    }
  }
  const videoIdMatch = html.match(/"videoId":\s*"([a-zA-Z0-9_-]{11})"/);
  const videoId = videoIdMatch ? videoIdMatch[1] : null;
  if (!videoId) {
    return { isLive: false };
  }
  const titleMatch = html.match(/<meta\s+(?:name|property)="og:title"\s+content="([^"]*)"/) || html.match(/<meta\s+content="([^"]*)"\s+(?:name|property)="og:title"/);
  const title = titleMatch ? decodeHTMLEntities(titleMatch[1]) : "Live now!";
  const thumbMatch = html.match(/<meta\s+(?:name|property)="og:image"\s+content="([^"]*)"/) || html.match(/<meta\s+content="([^"]*)"\s+(?:name|property)="og:image"/);
  const thumbnail = thumbMatch ? thumbMatch[1] : null;
  return {
    isLive: true,
    videoId,
    title,
    thumbnail
  };
}
__name(checkLiveStatus, "checkLiveStatus");
function decodeHTMLEntities(text) {
  return text.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'").replace(/&#x2F;/g, "/");
}
__name(decodeHTMLEntities, "decodeHTMLEntities");
function handleCORS(env) {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": env.ALLOWED_ORIGIN || "https://highintheflightsimsky.nl",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}
__name(handleCORS, "handleCORS");

// ../../../../../Users/johan/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// ../../../../../Users/johan/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
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

// .wrangler/tmp/bundle-74bqQY/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../../Users/johan/AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-74bqQY/middleware-loader.entry.ts
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
//# sourceMappingURL=worker.js.map
