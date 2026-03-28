import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { createServer } from "http";
import path from "path";
import { ensureTablesExist } from "./db";
import { storage } from "./storage";
import { WebhookHandlers } from './webhookHandlers';
import { migrateDevDataToProduction } from './migrate-prod-data';

async function seedSponsoredContent() {
  const miuraArticle = await storage.getArticleBySlug("miura-forged-irons");
  if (!miuraArticle) {
    await storage.createArticle({
      title: "The Art of Forged Irons",
      slug: "miura-forged-irons",
      category: "Golf",
      excerpt: "Handcrafted excellence since 1957. Experience the feel of true Japanese craftsmanship with Miura irons.",
      content: `<p><strong>Engineered for Precision. Built for the Player.</strong></p><p>At Miura, every iron starts with a simple belief — true performance comes from perfection in every detail. That's why our new line of Miura irons pushes the boundaries of feel, consistency, and control.</p><p>Forged with centuries-old craftsmanship and refined with today's most advanced techniques, these irons deliver a fluid feel and pure feedback that better players demand. Whether you're shaping shots or finding razor-sharp distances, Miura irons respond like no other.</p><p>This isn't mass production — it's masterful forging, one iron at a time, for golfers who want the best in their hands.</p><p><em>Experience the precision. Elevate your game with Miura irons.</em></p>`,
      heroImageUrl: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1200&h=600&fit=crop",
      imageUrls: [],
      publishedAt: new Date().toISOString().split('T')[0],
      author: "Sponsored Content",
      readingTime: 3,
      boostedLikes: 0,
    });
    console.log("Seeded Miura sponsored article");
  }
}

const app = express();
const httpServer = createServer(app);

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use("/uploads", express.static(path.join(process.cwd(), "public", "uploads")));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

async function initStripe() {
  try {
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
      console.log('Stripe keys not configured, skipping Stripe initialization');
      return;
    }
    console.log('Stripe initialized with standard API keys');
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn('STRIPE_WEBHOOK_SECRET not set - webhook signature verification will be skipped');
    }
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await ensureTablesExist();
  await migrateDevDataToProduction();
  await seedSponsoredContent();
  await initStripe();
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const port = parseInt(process.env.BACKEND_PORT || '5001', 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`API server running on port ${port}`);
    },
  );
})();
