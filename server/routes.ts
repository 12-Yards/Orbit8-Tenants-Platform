import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getRequestHostname, resolveTenantFromHostname } from "./tenant-resolution";
import { insertNewsletterSchema, insertArticleSchema, insertEventSchema, insertHeroSettingsSchema, insertInsiderTipSchema, articleCategories, insertCommentSchema, vibeCategories, vibeTypes, vibeReactionTypes, insertVibeSchema, insertVibeReactionSchema, insertVibeCommentSchema, updateProfileSchema, insertEventSuggestionSchema, eventSuggestionStatus, insertMemberReviewSchema, insertPollSchema, insertSubscriptionPlanSchema, insertTeeTimeOfferSchema, insertTeeTimeOfferCriteriaSchema, insertPodcastCommentSchema, insertTenantSchema } from "@shared/schema";

import { setupAuth, registerAuthRoutes, isAuthenticated, isAdmin, optionalAuth, seedAdminUser } from "./auth";
import { registerObjectStorageRoutes, ObjectStorageService } from "./replit_integrations/object_storage";
import { prisma, tenantContext, getDb } from "./db";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import fs from "fs";
import { stripeService } from "./stripeService";
import { getStripePublishableKey } from "./stripeClient";
import { ensureTenantNginxConfig } from "./nginx-tenant-config";
import { registerDnsSslRoutes } from "./dns-ssl-manager";
import { checkDomainHandler } from "./controllers/domainCheckController";

function getFrontendBaseUrl(req: any): string {
  if (process.env.REPLIT_DEPLOYMENT) {
    return `https://${process.env.REPLIT_DOMAINS || req.get('host')}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  const backendPort = process.env.BACKEND_PORT || '5001';
  const frontendPort = process.env.PORT || '5000';
  return `${req.protocol}://${req.get('host')?.replace(':' + backendPort, ':' + frontendPort) || 'localhost:' + frontendPort}`;
}
import { sirvService } from "./services/sirv";

const objectStorageService = new ObjectStorageService();

const sirvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage: storage_multer,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// Helper function to post match result to group
async function postMatchResultToGroup(
  eventId: string,
  winningTeamId: string,
  losingTeamId: string,
  roundName: string,
  _triggeredByUserId: string,
  isFinal: boolean = false
) {
  try {
    // Get event to find linkedGroupId
    const event = await storage.getEventById(eventId);
    if (!event || !event.linkedGroupId) {
      return; // No linked group, skip posting
    }

    // Get group info
    const group = await storage.getGroupById(event.linkedGroupId);
    if (!group) return;

    // Get site settings for logo
    const siteSettings = await storage.getSiteSettings();

    // Get teams info
    const teams = await storage.getCompetitionTeams(eventId);
    const winningTeam = teams.find(t => t.id === winningTeamId);
    const losingTeam = teams.find(t => t.id === losingTeamId);
    if (!winningTeam) return;

    // Get entries and users to find player names
    const entries = await storage.getEventEntries(eventId);
    
    // Helper to get user info from users table (mumblesVibeName is stored there)
    const getUserInfo = async (userId: string) => {
      const result = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, mumblesVibeName: true }
      });
      return result;
    };

    // Helper to get all player names from a team
    const getTeamPlayerNames = async (team: typeof winningTeam): Promise<string[]> => {
      const names: string[] = [];
      const playerSlots = [
        team.player1EntryId, team.player2EntryId, 
        team.player3EntryId, team.player4EntryId, 
        team.player5EntryId, team.player6EntryId
      ];
      
      for (const slotId of playerSlots) {
        if (slotId) {
          // Slot IDs are stored as "entryId:slotIndex"
          const [entryId, slotIndexStr] = slotId.split(':');
          const slotIndex = parseInt(slotIndexStr, 10);
          const entry = entries.find(e => e.id === entryId);
          
          if (entry) {
            if (slotIndex === 0) {
              // Slot 0 is the entry owner
              const user = await getUserInfo(entry.userId);
              if (user?.mumblesVibeName) {
                names.push(user.mumblesVibeName);
              } else if (entry.teamName) {
                names.push(entry.teamName);
              }
            } else if (entry.assignedPlayerIds && entry.assignedPlayerIds[slotIndex - 1]) {
              // Other slots are assigned players
              const playerId = entry.assignedPlayerIds[slotIndex - 1];
              const user = await getUserInfo(playerId);
              if (user?.mumblesVibeName) {
                names.push(user.mumblesVibeName);
              }
            }
          }
        }
      }
      return names;
    };

    // Get team name from any player slot's entry
    const getTeamName = (team: typeof winningTeam): string => {
      const playerSlots = [
        team.player1EntryId, team.player2EntryId, 
        team.player3EntryId, team.player4EntryId, 
        team.player5EntryId, team.player6EntryId
      ];
      
      for (const slotId of playerSlots) {
        if (slotId) {
          const entryId = slotId.split(':')[0];
          const entry = entries.find(e => e.id === entryId);
          if (entry?.teamName) {
            return entry.teamName;
          }
        }
      }
      return `Team ${team.teamNumber}`;
    };

    // Get player names for both teams
    const winnerPlayerNames = await getTeamPlayerNames(winningTeam);
    const loserPlayerNames = losingTeam ? await getTeamPlayerNames(losingTeam) : [];
    
    // Helper to format player names (e.g., "John, Jane, Bob and Alice")
    const formatPlayerNames = (names: string[], fallbackTeamName: string): string => {
      if (names.length === 0) {
        return fallbackTeamName;
      } else if (names.length === 1) {
        return names[0];
      } else if (names.length === 2) {
        return `${names[0]} and ${names[1]}`;
      } else {
        const namesCopy = [...names];
        const lastPlayer = namesCopy.pop();
        return `${namesCopy.join(", ")} and ${lastPlayer}`;
      }
    };

    const winnerNamesStr = formatPlayerNames(winnerPlayerNames, getTeamName(winningTeam));
    const loserNamesStr = losingTeam 
      ? formatPlayerNames(loserPlayerNames, getTeamName(losingTeam))
      : "their opponents";

    // Create the announcement post using "Admin" as author with site logo
    // Use different messaging for team competitions (no elimination) vs knockout (elimination)
    let content: string;
    if (event.eventType === "team_competition") {
      content = `${winnerNamesStr} have won their match against ${loserNamesStr}!`;
    } else if (isFinal) {
      content = `Congratulations! ${winnerNamesStr} won their final against ${loserNamesStr}!`;
    } else {
      content = `${winnerNamesStr} have won their ${roundName} match against ${loserNamesStr} and advances to the next round!`;
    }
    
    await storage.createGroupPost({
      groupId: event.linkedGroupId,
      userId: "admin", // Special admin user ID for system posts
      content,
      category: "Competition",
      postType: "announcement"
    });
  } catch (error) {
    console.error("Error posting match result to group:", error);
    // Don't throw - this is a non-critical operation
  }
}

async function sendCompetitionWinnerNotification(
  eventId: string,
  winningTeamId: string,
  losingTeamId: string
) {
  try {
    const event = await storage.getEventById(eventId);
    if (!event) return;

    const entries = await storage.getEventEntries(eventId);
    const teams = await storage.getCompetitionTeams(eventId);
    const winningTeam = teams.find(t => t.id === winningTeamId);
    const losingTeam = teams.find(t => t.id === losingTeamId);
    if (!winningTeam) return;

    const group = event.linkedGroupId ? await storage.getGroupById(event.linkedGroupId) : null;

    const getUserInfo = async (userId: string) => {
      const result = await prisma.users.findUnique({
        where: { id: userId },
        select: { id: true, mumblesVibeName: true }
      });
      return result;
    };

    const getTeamPlayerNames = async (team: typeof winningTeam): Promise<string[]> => {
      const names: string[] = [];
      const playerSlots = [
        team.player1EntryId, team.player2EntryId,
        team.player3EntryId, team.player4EntryId,
        team.player5EntryId, team.player6EntryId
      ];
      for (const slotId of playerSlots) {
        if (slotId) {
          const [entryId, slotIndexStr] = slotId.split(':');
          const slotIndex = parseInt(slotIndexStr, 10);
          const entry = entries.find(e => e.id === entryId);
          if (entry) {
            if (slotIndex === 0) {
              const user = await getUserInfo(entry.userId);
              if (user?.mumblesVibeName) names.push(user.mumblesVibeName);
              else if (entry.teamName) names.push(entry.teamName);
            } else if (entry.assignedPlayerIds && entry.assignedPlayerIds[slotIndex - 1]) {
              const playerId = entry.assignedPlayerIds[slotIndex - 1];
              const user = await getUserInfo(playerId);
              if (user?.mumblesVibeName) names.push(user.mumblesVibeName);
            }
          }
        }
      }
      return names;
    };

    const formatPlayerNames = (names: string[]): string => {
      if (names.length === 0) return "Unknown";
      if (names.length === 1) return names[0];
      if (names.length === 2) return `${names[0]} and ${names[1]}`;
      const copy = [...names];
      const last = copy.pop();
      return `${copy.join(", ")} and ${last}`;
    };

    const winnerNames = formatPlayerNames(await getTeamPlayerNames(winningTeam));
    const loserNames = losingTeam ? formatPlayerNames(await getTeamPlayerNames(losingTeam)) : "their opponents";

    const allParticipantUserIds = new Set<string>();
    for (const entry of entries) {
      allParticipantUserIds.add(entry.userId);
      if (entry.assignedPlayerIds) {
        for (const pid of entry.assignedPlayerIds) {
          if (pid) allParticipantUserIds.add(pid);
        }
      }
    }

    const metadata = JSON.stringify({
      eventName: event.name,
      eventSlug: event.slug,
      winnerNames,
      loserNames,
      groupSlug: group?.slug,
    });

    for (const userId of allParticipantUserIds) {
      try {
        await storage.createConnectionNotification({
          userId,
          type: "competition_winner",
          eventId: event.id,
          metadata,
        });
      } catch (err) {
        console.error(`Failed to send winner notification to ${userId}:`, err);
      }
    }
  } catch (error) {
    console.error("Error sending competition winner notification:", error);
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.use("/api", async (req, res, next) => {
    const host = req.get("host") || "";
    const hostname = host.split(":")[0];
    try {
      const previewTenantId = req.query._tenantId as string | undefined;
      if (previewTenantId) {
        const tenant = await prisma.tenants.findFirst({
          where: { id: previewTenantId },
        });
        if (tenant) {
          (req as any).tenantId = tenant.id;
        }
      } else {
        let tenant = await prisma.tenants.findFirst({
          where: { domainName: hostname },
        });
        if (!tenant) {
          const parts = hostname.split(".");
          if (parts.length >= 2) {
            tenant = await prisma.tenants.findFirst({
              where: { subDomain: parts[0] },
            });
          }
        }
        if (tenant) {
          (req as any).tenantId = tenant.id;
        }
      }
    } catch {}
    tenantContext.run((req as any).tenantId || null, () => next());
  });

  setupAuth(app);
  registerAuthRoutes(app);
  registerObjectStorageRoutes(app);

  app.post("/api/uploads/file", isAuthenticated, sirvUpload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const url = await sirvService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({ url, objectPath: url });
    } catch (error) {
      console.error("Error uploading to Sirv:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Serve SSO documentation as downloadable file
  app.get("/SSO-Integration-Guide.docx", (req, res) => {
    const docPath = path.join(process.cwd(), "public", "SSO-Integration-Guide.docx");
    if (fs.existsSync(docPath)) {
      res.download(docPath, "SSO-Integration-Guide.docx");
    } else {
      res.status(404).json({ error: "Document not found" });
    }
  });

  await storage.seedDataIfEmpty();
  await seedAdminUser();

  try {
    const allTenants = await prisma.tenants.findMany();
    for (const t of allTenants) {
      const hero = await prisma.heroSettings.findFirst({ where: { tenantId: t.id } });
      if (hero && hero.title !== t.name) {
        await prisma.heroSettings.update({ where: { id: hero.id }, data: { title: t.name } });
      }
      const site = await prisma.siteSettings.findFirst({ where: { tenantId: t.id } });
      if (site && (site as any).platformName !== t.name) {
        await prisma.siteSettings.update({ where: { id: site.id }, data: { platformName: t.name } });
      }
    }
    if (allTenants.length > 0) console.log(`Synced hero/site settings names for ${allTenants.length} tenants`);
  } catch (e) {
    console.error("Failed to sync tenant names:", e);
  }

  // Global Search endpoint
  app.get("/api/search", optionalAuth, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim().length === 0) {
        return res.json({
          query: '',
          events: [],
          articles: [],
          reviews: [],
          users: [],
          groups: []
        });
      }
      const userId = (req as any).userId;
      console.log("Search request - userId:", userId, "query:", query);
      const results = await storage.searchContent(query, userId);
      res.json(results);
    } catch (error) {
      console.error("Error searching content:", error);
      res.status(500).json({ error: "Failed to search content" });
    }
  });

  app.get("/api/articles", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      if (category && articleCategories.includes(category as any)) {
        const articles = await storage.getArticlesByCategory(category as any);
        return res.json(articles);
      }
      const articles = await storage.getArticles();
      res.json(articles);
    } catch (error) {
      console.error("Error fetching articles:", error);
      res.status(500).json({ error: "Failed to fetch articles" });
    }
  });

  app.get("/api/articles/:slug", async (req, res) => {
    try {
      const article = await storage.getArticleBySlug(req.params.slug);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error fetching article:", error);
      res.status(500).json({ error: "Failed to fetch article" });
    }
  });

  app.post("/api/articles", isAdmin, async (req, res) => {
    try {
      const data = insertArticleSchema.parse(req.body);
      const article = await storage.createArticle(data);
      res.status(201).json(article);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid article data", details: error.errors });
      }
      console.error("Error creating article:", error);
      res.status(500).json({ error: "Failed to create article" });
    }
  });

  app.put("/api/articles/:id", isAdmin, async (req, res) => {
    try {
      const article = await storage.updateArticle(req.params.id, req.body);
      if (!article) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json(article);
    } catch (error) {
      console.error("Error updating article:", error);
      res.status(500).json({ error: "Failed to update article" });
    }
  });

  app.delete("/api/articles/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteArticle(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Article not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article:", error);
      res.status(500).json({ error: "Failed to delete article" });
    }
  });

  app.get("/api/articles/:id/sections", async (req, res) => {
    try {
      const sections = await storage.getArticleSections(req.params.id);
      res.json(sections);
    } catch (error) {
      console.error("Error fetching article sections:", error);
      res.status(500).json({ error: "Failed to fetch article sections" });
    }
  });

  app.put("/api/articles/:id/sections", isAdmin, async (req, res) => {
    try {
      const { sections } = req.body;
      if (!Array.isArray(sections)) {
        return res.status(400).json({ error: "Sections must be an array" });
      }
      const result = await storage.replaceArticleSections(req.params.id, sections);
      res.json(result);
    } catch (error) {
      console.error("Error updating article sections:", error);
      res.status(500).json({ error: "Failed to update article sections" });
    }
  });

  // Mux video upload endpoints
  app.post("/api/mux/upload-url", isAdmin, async (req: any, res) => {
    try {
      const Mux = (await import("@mux/mux-node")).default;
      const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET });
      const upload = await mux.video.uploads.create({
        cors_origin: "*",
        new_asset_settings: {
          playback_policy: ["public"],
          encoding_tier: "baseline",
        },
      });
      res.json({ uploadUrl: upload.url, uploadId: upload.id, assetId: upload.asset_id });
    } catch (error) {
      console.error("Error creating Mux upload:", error);
      res.status(500).json({ error: "Failed to create upload URL" });
    }
  });

  app.get("/api/mux/upload/:uploadId", isAdmin, async (req: any, res) => {
    try {
      const Mux = (await import("@mux/mux-node")).default;
      const mux = new Mux({ tokenId: process.env.MUX_TOKEN_ID, tokenSecret: process.env.MUX_TOKEN_SECRET });
      const upload = await mux.video.uploads.retrieve(req.params.uploadId);
      if (upload.asset_id) {
        const asset = await mux.video.assets.retrieve(upload.asset_id);
        const playbackId = asset.playback_ids?.[0]?.id || null;
        res.json({
          status: asset.status,
          assetId: asset.id,
          playbackId,
          duration: asset.duration,
        });
      } else {
        res.json({ status: "waiting", assetId: null, playbackId: null });
      }
    } catch (error) {
      console.error("Error checking Mux upload status:", error);
      res.status(500).json({ error: "Failed to check upload status" });
    }
  });

  // Podcasts
  app.get("/api/podcasts", async (req, res) => {
    try {
      const podcastList = await storage.getActivePodcasts();
      res.json(podcastList);
    } catch (error) {
      console.error("Error fetching podcasts:", error);
      res.status(500).json({ error: "Failed to fetch podcasts" });
    }
  });

  app.get("/api/podcasts/:slug", async (req, res) => {
    try {
      const podcast = await storage.getPodcastBySlug(req.params.slug);
      if (!podcast) {
        return res.status(404).json({ error: "Podcast not found" });
      }
      res.json(podcast);
    } catch (error) {
      console.error("Error fetching podcast:", error);
      res.status(500).json({ error: "Failed to fetch podcast" });
    }
  });

  app.get("/api/admin/podcasts", isAdmin, async (req, res) => {
    try {
      const podcastList = await storage.getPodcasts();
      res.json(podcastList);
    } catch (error) {
      console.error("Error fetching podcasts:", error);
      res.status(500).json({ error: "Failed to fetch podcasts" });
    }
  });

  app.post("/api/admin/podcasts", isAdmin, async (req, res) => {
    try {
      const podcast = await storage.createPodcast(req.body);
      res.json(podcast);
    } catch (error) {
      console.error("Error creating podcast:", error);
      res.status(500).json({ error: "Failed to create podcast" });
    }
  });

  app.put("/api/admin/podcasts/:id", isAdmin, async (req, res) => {
    try {
      const podcast = await storage.updatePodcast(req.params.id, req.body);
      if (!podcast) {
        return res.status(404).json({ error: "Podcast not found" });
      }
      res.json(podcast);
    } catch (error) {
      console.error("Error updating podcast:", error);
      res.status(500).json({ error: "Failed to update podcast" });
    }
  });

  app.delete("/api/admin/podcasts/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deletePodcast(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Podcast not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting podcast:", error);
      res.status(500).json({ error: "Failed to delete podcast" });
    }
  });

  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          if (event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition") {
            const entryCount = await storage.getEventEntryCount(event.id);
            return { ...event, currentEntries: entryCount };
          }
          return event;
        })
      );
      res.json(eventsWithCounts);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/by-slug/:slug", async (req, res) => {
    try {
      const event = await storage.getEventBySlug(req.params.slug);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", isAdmin, async (req: any, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const userId = req.userId;
      
      // First create the event without Stripe info
      let event = await storage.createEvent(data);
      
      // If this is a competition event with an entry fee, create Stripe product/price
      if ((data.eventType === 'competition' || data.eventType === 'knockout' || data.eventType === 'team_competition' || data.eventType === 'individual_competition') && data.entryFee) {
        const entryFeeInPence = Math.round(parseFloat(data.entryFee) * 100);
        if (entryFeeInPence > 0) {
          try {
            const { product, price } = await stripeService.createEventProduct(
              data.name,
              event.id,
              entryFeeInPence,
              'gbp'
            );
            event = await storage.updateEvent(event.id, {
              stripeProductId: product.id,
              stripePriceId: price.id
            }) || event;
          } catch (stripeError) {
            console.error("Error creating Stripe product for event:", stripeError);
          }
        }
      }
      
      // Auto-create community group when isEventGroup is enabled
      if (data.isEventGroup && !event.linkedGroupId) {
        try {
          const newGroup = await storage.createGroup({
            name: event.name,
            description: `Community group for ${event.name}`,
            imageUrl: event.imageUrl || "",
            createdBy: userId,
            isPublic: false,
            isActive: true,
            eventId: event.id,
          });
          event = await storage.updateEvent(event.id, { linkedGroupId: newGroup.id }) || event;
          
          await storage.createGroupMembership({
            groupId: newGroup.id,
            userId,
            role: "admin",
            status: "approved"
          });
        } catch (groupError) {
          console.error("Error auto-creating group for event:", groupError);
        }
      }
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid event data", details: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.put("/api/events/:id", isAdmin, async (req, res) => {
    try {
      // Normalize empty strings to null for optional fields
      const updates = { ...req.body };
      if (updates.ticketUrl === '') updates.ticketUrl = null;
      if (updates.endDate === '') updates.endDate = null;
      
      // Get the existing event to check if we need to create/update Stripe product
      const existingEvent = await storage.getEventById(req.params.id);
      if (!existingEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Handle Stripe product creation/update for competition events with entry fees
      if (updates.eventType === 'competition' && updates.entryFee) {
        const entryFeeInPence = Math.round(parseFloat(updates.entryFee) * 100);
        if (entryFeeInPence > 0) {
          try {
            if (existingEvent.stripeProductId) {
              // Update existing product and create new price
              const { price } = await stripeService.updateEventProduct(
                existingEvent.stripeProductId,
                updates.name || existingEvent.name,
                entryFeeInPence,
                'gbp'
              );
              updates.stripePriceId = price.id;
            } else {
              // Create new Stripe product
              const { product, price } = await stripeService.createEventProduct(
                updates.name || existingEvent.name,
                req.params.id,
                entryFeeInPence,
                'gbp'
              );
              updates.stripeProductId = product.id;
              updates.stripePriceId = price.id;
            }
          } catch (stripeError) {
            console.error("Error updating Stripe product for event:", stripeError);
            // Continue without Stripe update
          }
        }
      }
      
      let event = await storage.updateEvent(req.params.id, updates);
      
      // Auto-create competition group if isEventGroup is enabled but no group exists yet
      if (event && event.isEventGroup && !event.linkedGroupId) {
        try {
          const userId = (req as any).userId;
          const newGroup = await storage.createGroup({
            name: event.name,
            description: `Community group for ${event.name}`,
            imageUrl: event.imageUrl || "",
            createdBy: userId,
            isPublic: false,
            isActive: true,
            eventId: event.id,
          });
          event = await storage.updateEvent(event.id, { linkedGroupId: newGroup.id }) || event;
          
          await storage.createGroupMembership({
            groupId: newGroup.id,
            userId,
            role: "admin",
            status: "approved"
          });
        } catch (groupError) {
          console.error("Error auto-creating group for updated event:", groupError);
        }
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  app.patch("/api/admin/events/:id/featured", isAdmin, async (req, res) => {
    try {
      const { isFeatured } = req.body;
      if (typeof isFeatured !== 'boolean') {
        return res.status(400).json({ error: "isFeatured must be a boolean" });
      }
      const event = await storage.updateEvent(req.params.id, { isFeatured });
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error updating event featured status:", error);
      res.status(500).json({ error: "Failed to update event featured status" });
    }
  });

  app.get("/api/events/:id/membership", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (!event.isEventGroup) {
        return res.json({ isMember: false });
      }
      if (event.linkedGroupId) {
        const group = await storage.getGroupById(event.linkedGroupId);
        const membership = await storage.getGroupMembership(event.linkedGroupId, userId);
        const isMember = membership?.status === 'approved';
        return res.json({ isMember, groupSlug: group?.slug });
      }
      return res.json({ isMember: false });
    } catch (error) {
      console.error("Error checking event membership:", error);
      res.status(500).json({ error: "Failed to check membership" });
    }
  });

  app.post("/api/events/:id/join-group", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (!event.isEventGroup) {
        return res.status(400).json({ error: "This event does not have a community group" });
      }

      let groupId = event.linkedGroupId;
      let groupSlug: string;

      if (!groupId) {
        const slug = `event-${event.slug}`;
        const newGroup = await storage.createGroup({
          name: event.name,
          description: `Community group for ${event.name}`,
          imageUrl: event.imageUrl,
          createdBy: userId,
          isPublic: false,
          isActive: true,
          eventId: event.id,
        });
        groupId = newGroup.id;
        groupSlug = newGroup.slug;
        await storage.updateEvent(event.id, { linkedGroupId: groupId });
      } else {
        const group = await storage.getGroupById(groupId);
        if (!group) {
          return res.status(500).json({ error: "Group not found" });
        }
        groupSlug = group.slug;
      }

      const existingMembership = await storage.getGroupMembership(groupId, userId);
      if (existingMembership?.status === 'approved') {
        const group = await storage.getGroupById(groupId);
        return res.json({ success: true, groupSlug: group?.slug, alreadyMember: true });
      }

      await storage.createGroupMembership({
        groupId,
        userId,
        role: "member",
        status: "approved",
      });

      const group = await storage.getGroupById(groupId);
      res.json({ success: true, groupSlug: group?.slug });
    } catch (error) {
      console.error("Error joining event group:", error);
      res.status(500).json({ error: "Failed to join event group" });
    }
  });

  app.get("/api/admin/events", isAdmin, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      const eventsWithCounts = await Promise.all(
        events.map(async (event) => {
          if (event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition") {
            const entryCount = await storage.getEventEntryCount(event.id);
            return { ...event, currentEntries: entryCount };
          }
          return event;
        })
      );
      res.json(eventsWithCounts);
    } catch (error) {
      console.error("Error fetching all events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Event Entries (Knockout Competitions)
  app.get("/api/events/:id/entries", async (req, res) => {
    try {
      const entries = await storage.getEventEntries(req.params.id);
      res.json(entries);
    } catch (error) {
      console.error("Error fetching event entries:", error);
      res.status(500).json({ error: "Failed to fetch event entries" });
    }
  });

  app.patch("/api/events/:id/mark-entrants-seen", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;
      const entryCount = await storage.getEventEntryCount(eventId);
      const updated = await storage.updateEvent(eventId, { adminLastSeenEntrantCount: entryCount });
      res.json({ adminLastSeenEntrantCount: entryCount });
    } catch (error) {
      console.error("Error marking entrants seen:", error);
      res.status(500).json({ error: "Failed to mark entrants seen" });
    }
  });

  // Admin endpoint to fill competition with test entries
  app.post("/api/events/:id/fill-test-entries", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;

      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.eventType !== "knockout" && event.eventType !== "team_competition" && event.eventType !== "individual_competition") {
        return res.status(400).json({ error: "This event is not a competition" });
      }
      if (!event.maxEntries) {
        return res.status(400).json({ error: "This competition has no max entries set" });
      }

      // Count total places taken (sum of playerCount from all entries)
      const existingEntries = await storage.getEventEntries(eventId);
      const placesTaken = existingEntries.reduce((sum, entry) => sum + (entry.playerCount || 1), 0);
      const entriesToAdd = event.maxEntries - placesTaken;

      if (entriesToAdd <= 0) {
        return res.status(400).json({ error: "Competition is already full" });
      }

      const testNames = [
        "Alex Smith", "Jordan Brown", "Taylor Wilson", "Casey Jones", "Morgan Davis",
        "Riley Taylor", "Drew Anderson", "Cameron White", "Jamie Martin", "Avery Thompson",
        "Quinn Garcia", "Hayden Robinson", "Peyton Clark", "Skyler Lewis", "Reese Walker",
        "Finley Hall", "Dakota Young", "Rowan King", "Sage Wright", "Phoenix Scott",
        "River Green", "Blake Adams", "Charlie Baker", "Emerson Nelson", "Harper Carter",
        "Kendall Mitchell", "Logan Perez", "Parker Roberts", "Sydney Turner", "Jesse Phillips"
      ];

      // Auto-create group if event has isEventGroup but no linkedGroupId
      if (event.isEventGroup && !event.linkedGroupId) {
        try {
          const newGroup = await storage.createGroup({
            name: event.name,
            description: `Community group for ${event.name}`,
            imageUrl: event.imageUrl || "",
            createdBy: req.userId,
            isPublic: false,
            isActive: true,
            eventId: event.id,
          });
          await storage.updateEvent(event.id, { linkedGroupId: newGroup.id });
          await storage.createGroupMembership({
            groupId: newGroup.id,
            userId: req.userId,
            role: "admin",
            status: "approved"
          });
        } catch (groupError) {
          console.error("Error auto-creating group during fill:", groupError);
        }
      }

      for (let i = 0; i < entriesToAdd; i++) {
        const testName = testNames[i % testNames.length] + (i >= testNames.length ? ` ${Math.floor(i / testNames.length) + 1}` : "");
        const testUserId = `test-${Date.now().toString(36)}-${i}`.slice(0, 36);
        
        await storage.createEventEntry({
          eventId,
          userId: testUserId,
          teamName: testName,
          playerNames: null,
          paymentStatus: "confirmed",
          paymentAmount: event.entryFee || null
        });
      }

      res.json({ message: `Added ${entriesToAdd} test entries`, count: entriesToAdd });
    } catch (error) {
      console.error("Error filling test entries:", error);
      res.status(500).json({ error: "Failed to add test entries" });
    }
  });

  // Admin endpoint to clear test entries
  app.delete("/api/events/:id/test-entries", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;

      const entries = await storage.getEventEntries(eventId);
      let deletedCount = 0;
      for (const entry of entries) {
        if (entry.userId.startsWith('test-')) {
          await storage.deleteEventEntry(entry.id);
          deletedCount++;
        }
      }

      res.json({ message: `Removed ${deletedCount} test entries`, count: deletedCount });
    } catch (error) {
      console.error("Error clearing test entries:", error);
      res.status(500).json({ error: "Failed to clear test entries" });
    }
  });

  app.get("/api/events/:id/entry-count", async (req, res) => {
    try {
      // Get all entries and calculate total places taken using stored playerCount
      const entries = await storage.getEventEntries(req.params.id);
      const totalPlaces = entries.reduce((sum, entry) => {
        // Each entry stores its playerCount (set at signup time)
        return sum + (entry.playerCount || 1);
      }, 0);
      
      res.json({ count: totalPlaces });
    } catch (error) {
      console.error("Error fetching entry count:", error);
      res.status(500).json({ error: "Failed to fetch entry count" });
    }
  });

  app.get("/api/events/:id/attendance", async (req, res) => {
    try {
      const attendees = await storage.getEventAttendees(req.params.id);
      const attending = attendees.filter(a => a.status === "attending").length;
      const maybe = attendees.filter(a => a.status === "maybe").length;
      res.json({ attending, maybe, total: attending + maybe });
    } catch (error) {
      console.error("Error fetching event attendance:", error);
      res.status(500).json({ error: "Failed to fetch attendance" });
    }
  });

  app.get("/api/events/:id/my-attendance", isAuthenticated, async (req: any, res) => {
    try {
      const record = await storage.getUserAttendance(req.params.id, req.userId);
      res.json({ status: record?.status || "not_attending", ticketNumber: record?.ticketNumber || null });
    } catch (error) {
      console.error("Error checking attendance:", error);
      res.status(500).json({ error: "Failed to check attendance" });
    }
  });

  app.get("/api/events/:id/attendees-detail", isAdmin, async (req: any, res) => {
    try {
      const attendees = await storage.getEventAttendees(req.params.id);
      const details = [];
      for (const attendee of attendees) {
        const user = await storage.getUserById(attendee.userId);
        if (user) {
          details.push({
            id: attendee.id,
            userId: attendee.userId,
            status: attendee.status,
            displayName: (user as any).mumblesVibeName || user.email,
            email: user.email,
            createdAt: attendee.createdAt,
            ticketNumber: attendee.ticketNumber,
          });
        }
      }
      res.json(details);
    } catch (error) {
      console.error("Error fetching attendee details:", error);
      res.status(500).json({ error: "Failed to fetch attendees" });
    }
  });

  app.post("/api/events/:id/set-attendance", isAuthenticated, async (req: any, res) => {
    try {
      const { status } = req.body;
      if (!["attending", "maybe", "not_attending"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const result = await storage.setEventAttendance(req.params.id, req.userId, status);
      res.json({ status, ticketNumber: result?.ticketNumber || null });
    } catch (error) {
      console.error("Error setting attendance:", error);
      res.status(500).json({ error: "Failed to set attendance" });
    }
  });

  app.get("/api/my-calendar", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const attendances = await storage.getUserAttendingEvents(userId);
      const attendanceMap = new Map(attendances.map(a => [a.eventId, a.status]));
      
      const entries = await storage.getEventEntriesByUser(userId);
      const enteredEventIds = entries.map(e => e.eventId);
      
      const allEventIds = [...new Set([...attendances.map(a => a.eventId), ...enteredEventIds])];
      
      const calendarEvents: any[] = [];
      for (const eventId of allEventIds) {
        const event = await storage.getEventById(eventId);
        if (event) {
          const attendanceStatus = attendanceMap.get(eventId);
          calendarEvents.push({
            ...event,
            attendanceType: enteredEventIds.includes(eventId) ? "entered" : (attendanceStatus || "attending")
          });
        }
      }
      
      calendarEvents.sort((a, b) => a.startDate.localeCompare(b.startDate));
      res.json(calendarEvents);
    } catch (error) {
      console.error("Error fetching calendar:", error);
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  app.get("/api/events/:id/results", async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });

      const teams = await storage.getCompetitionTeams(req.params.id);
      const entries = await storage.getEventEntries(req.params.id);

      const playerIds = new Set<string>();
      entries.forEach((entry: any) => {
        if (entry.userId) playerIds.add(entry.userId);
        if (entry.assignedPlayerIds) {
          entry.assignedPlayerIds.forEach((id: string) => {
            if (id && !id.startsWith("guest:")) playerIds.add(id);
          });
        }
      });
      const profiles: { id: string; mumblesVibeName: string; profileImageUrl: string | null }[] = [];
      for (const id of playerIds) {
        const u = await storage.getUserById(id);
        if (u) profiles.push({ id: u.id, mumblesVibeName: (u as any).mumblesVibeName || u.username || "Player", profileImageUrl: (u as any).profileImageUrl || null });
      }

      const sortOrder = (event as any).leagueTableSortOrder || "highest_first";
      const sortMultiplier = sortOrder === "lowest_first" ? 1 : -1;
      const hasTeamHandicap = !!(event as any).allowTeamHandicap;

      if (event.eventType === "team_competition") {
        const getNetScore = (t: any) => (t.teamStableford || 0) - (t.teamHandicap || 0);
        const teamsSorted = [...teams].sort((a: any, b: any) => {
          if (hasTeamHandicap) return sortMultiplier * (getNetScore(a) - getNetScore(b));
          return sortMultiplier * (((a as any).teamStableford || 0) - ((b as any).teamStableford || 0));
        });
        const teamsWithScores = teamsSorted.filter((t: any) => (t as any).teamStableford != null && (t as any).teamStableford > 0);

        const teamResults = teamsWithScores.map((team: any) => {
          const slotIds = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
          const playerNames: string[] = [];
          slotIds.forEach((slotId: string) => {
            const parts = slotId.includes(':') ? slotId.split(':') : [slotId, '0'];
            const baseEntryId = parts[0];
            const slotIndex = parseInt(parts[1], 10);
            const entry = entries.find((e: any) => e.id === baseEntryId);
            if (entry) {
              if (slotIndex === 0) {
                const profile = profiles.find(p => p.id === (entry as any).userId);
                playerNames.push(profile?.mumblesVibeName || (entry as any).playerNames?.[0] || (entry as any).teamName || "Player");
              } else {
                const assignedPlayerIds = (entry as any).assignedPlayerIds || [];
                const assignedUserId = assignedPlayerIds[slotIndex - 1];
                if (assignedUserId) {
                  if (assignedUserId.startsWith("guest:")) {
                    playerNames.push(assignedUserId.replace("guest:", ""));
                  } else {
                    const profile = profiles.find(p => p.id === assignedUserId);
                    playerNames.push(profile?.mumblesVibeName || (entry as any).playerNames?.[slotIndex] || `Player ${slotIndex + 1}`);
                  }
                } else {
                  playerNames.push((entry as any).playerNames?.[slotIndex] || `Player ${slotIndex + 1}`);
                }
              }
            }
          });

          return {
            teamNumber: team.teamNumber,
            teamName: playerNames.length > 0 ? playerNames.join(" & ") : `Team ${team.teamNumber}`,
            gross: (team as any).teamStableford || 0,
            handicap: (team as any).teamHandicap ?? null,
            net: hasTeamHandicap ? ((team as any).teamStableford || 0) - ((team as any).teamHandicap || 0) : null,
            score: hasTeamHandicap ? ((team as any).teamStableford || 0) - ((team as any).teamHandicap || 0) : ((team as any).teamStableford || 0),
          };
        });

        let individualResults: any[] = [];
        if ((event as any).allowIndividualStableford) {
          const playersWithScores: any[] = [];
          entries.forEach((entry: any) => {
            const playerScoresObj = (entry.playerScores as Record<number, number>) || {};
            const ownerScore = playerScoresObj[0] ?? entry.score;
            if (ownerScore != null && ownerScore > 0) {
              const profile = profiles.find(p => p.id === entry.userId);
              playersWithScores.push({ name: profile?.mumblesVibeName || entry.playerNames?.[0] || "Player", score: ownerScore, profileImage: profile?.profileImageUrl || null });
            }
            if (entry.assignedPlayerIds) {
              entry.assignedPlayerIds.forEach((assignedId: string, idx: number) => {
                if (assignedId) {
                  const slotIdx = idx + 1;
                  const slotScore = playerScoresObj[slotIdx];
                  if (slotScore != null && slotScore > 0) {
                    const isGuest = assignedId.startsWith("guest:");
                    const profile = !isGuest ? profiles.find(p => p.id === assignedId) : null;
                    playersWithScores.push({ name: isGuest ? assignedId.replace("guest:", "") : (profile?.mumblesVibeName || "Player"), score: slotScore, profileImage: isGuest ? null : (profile?.profileImageUrl || null) });
                  }
                }
              });
            }
          });
          playersWithScores.sort((a: any, b: any) => sortMultiplier * (a.score - b.score));
          individualResults = playersWithScores;
        }

        return res.json({
          eventType: "team_competition",
          hasTeamHandicap,
          allowIndividualStableford: !!(event as any).allowIndividualStableford,
          teamResults,
          individualResults,
        });
      }

      if (event.eventType === "knockout") {
        const bracket = await storage.getCompetitionBracket(req.params.id);
        if (!bracket) {
          return res.json({ eventType: "knockout", rounds: [], hasResults: false });
        }
        const rounds = await storage.getCompetitionRounds(bracket.id);
        const matches = await storage.getCompetitionMatchesByBracket(bracket.id);

        const getTeamName = (teamId: string | null) => {
          if (!teamId) return "TBD";
          const team = teams.find((t: any) => t.id === teamId);
          if (!team) return "TBD";
          const slotIds = [team.player1EntryId, team.player2EntryId, team.player3EntryId, team.player4EntryId, team.player5EntryId, team.player6EntryId].filter(Boolean);
          const playerNames: string[] = [];
          slotIds.forEach((slotId: string) => {
            const parts = slotId.includes(':') ? slotId.split(':') : [slotId, '0'];
            const baseEntryId = parts[0];
            const slotIndex = parseInt(parts[1], 10);
            const entry = entries.find((e: any) => e.id === baseEntryId);
            if (entry) {
              if (slotIndex === 0) {
                const profile = profiles.find(p => p.id === (entry as any).userId);
                playerNames.push(profile?.mumblesVibeName || (entry as any).playerNames?.[0] || (entry as any).teamName || "Player");
              } else {
                const assignedPlayerIds = (entry as any).assignedPlayerIds || [];
                const assignedUserId = assignedPlayerIds[slotIndex - 1];
                if (assignedUserId) {
                  if (assignedUserId.startsWith("guest:")) {
                    playerNames.push(assignedUserId.replace("guest:", ""));
                  } else {
                    const profile = profiles.find(p => p.id === assignedUserId);
                    playerNames.push(profile?.mumblesVibeName || (entry as any).playerNames?.[slotIndex] || `Player ${slotIndex + 1}`);
                  }
                } else {
                  playerNames.push((entry as any).playerNames?.[slotIndex] || `Player ${slotIndex + 1}`);
                }
              }
            }
          });
          return playerNames.length > 0 ? playerNames.join(" & ") : `Team ${team.teamNumber}`;
        };

        const roundResults = rounds.map((round: any) => {
          const roundMatches = matches.filter((m: any) => m.roundId === round.id);
          const completedMatches = roundMatches.filter((m: any) => m.winnerId);
          return {
            roundName: round.roundName,
            matches: completedMatches.map((match: any) => ({
              matchNumber: match.matchNumber,
              team1Name: getTeamName(match.team1Id),
              team2Name: getTeamName(match.team2Id),
              team1IsWinner: match.winnerId === match.team1Id,
              team2IsWinner: match.winnerId === match.team2Id,
            })),
          };
        }).filter((r: any) => r.matches.length > 0);

        return res.json({ eventType: "knockout", rounds: roundResults, hasResults: roundResults.length > 0 });
      }

      return res.json({ eventType: event.eventType, message: "No results available." });
    } catch (error) {
      console.error("Error fetching event results:", error);
      res.status(500).json({ error: "Failed to fetch results" });
    }
  });

  // Get competition teams
  app.get("/api/events/:id/teams", async (req, res) => {
    try {
      const teams = await storage.getCompetitionTeams(req.params.id);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching competition teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  // Create random teams
  app.post("/api/events/:id/teams/random", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;
      
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.eventType !== "knockout" && event.eventType !== "team_competition" && event.eventType !== "individual_competition") {
        return res.status(400).json({ error: "This event is not a competition" });
      }

      // Clear existing teams
      await storage.deleteCompetitionTeams(eventId);

      // Get all entries
      const entries = await storage.getEventEntries(eventId);
      if (entries.length < 2) {
        return res.status(400).json({ error: "Need at least 2 entrants to create teams" });
      }

      // Build player slots array (each entry can have multiple slots based on playerCount)
      const playerSlots: { entryId: string; slotIndex: number; slotId: string }[] = [];
      for (const entry of entries) {
        const count = entry.playerCount || 1;
        for (let i = 0; i < count; i++) {
          playerSlots.push({
            entryId: entry.id,
            slotIndex: i,
            slotId: `${entry.id}:${i}`
          });
        }
      }

      // Shuffle player slots randomly
      const shuffled = [...playerSlots].sort(() => Math.random() - 0.5);

      // Create teams based on event's teamSize setting
      const eventTeamSize = event.teamSize || 2;
      const teams = [];
      for (let i = 0; i < shuffled.length; i += eventTeamSize) {
        const teamNumber = Math.floor(i / eventTeamSize) + 1;
        const teamSlots = shuffled.slice(i, i + eventTeamSize);
        
        const team = await storage.createCompetitionTeam({
          eventId,
          teamNumber,
          player1EntryId: teamSlots[0]?.slotId || null,
          player2EntryId: teamSlots[1]?.slotId || null,
          player3EntryId: teamSlots[2]?.slotId || null,
          player4EntryId: teamSlots[3]?.slotId || null,
          player5EntryId: teamSlots[4]?.slotId || null,
          player6EntryId: teamSlots[5]?.slotId || null
        });
        teams.push(team);
      }

      res.json({ message: `Created ${teams.length} teams`, teams });
    } catch (error) {
      console.error("Error creating random teams:", error);
      res.status(500).json({ error: "Failed to create teams" });
    }
  });

  // Save manual teams
  app.post("/api/events/:id/teams/manual", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;
      const { teams } = req.body;

      if (!teams || !Array.isArray(teams)) {
        return res.status(400).json({ error: "Invalid teams data" });
      }

      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Clear existing teams
      await storage.deleteCompetitionTeams(eventId);

      // Create new teams - support slot IDs (entryId:slotIndex) and legacy formats
      const createdTeams = [];
      for (let i = 0; i < teams.length; i++) {
        const teamData = teams[i];
        
        // Handle new format (playerSlotIds with entryId:slotIndex) and legacy formats
        let player1Id, player2Id, player3Id, player4Id, player5Id, player6Id;
        if (teamData.playerSlotIds && Array.isArray(teamData.playerSlotIds)) {
          // New format: slot IDs like "entryId:0" or "entryId:1"
          player1Id = teamData.playerSlotIds[0] || null;
          player2Id = teamData.playerSlotIds[1] || null;
          player3Id = teamData.playerSlotIds[2] || null;
          player4Id = teamData.playerSlotIds[3] || null;
          player5Id = teamData.playerSlotIds[4] || null;
          player6Id = teamData.playerSlotIds[5] || null;
        } else if (teamData.playerEntryIds && Array.isArray(teamData.playerEntryIds)) {
          // Legacy format: just entry IDs (assume slot 0 - entry owner)
          player1Id = teamData.playerEntryIds[0] ? `${teamData.playerEntryIds[0]}:0` : null;
          player2Id = teamData.playerEntryIds[1] ? `${teamData.playerEntryIds[1]}:0` : null;
          player3Id = teamData.playerEntryIds[2] ? `${teamData.playerEntryIds[2]}:0` : null;
          player4Id = teamData.playerEntryIds[3] ? `${teamData.playerEntryIds[3]}:0` : null;
          player5Id = teamData.playerEntryIds[4] ? `${teamData.playerEntryIds[4]}:0` : null;
          player6Id = teamData.playerEntryIds[5] ? `${teamData.playerEntryIds[5]}:0` : null;
        } else {
          player1Id = teamData.player1EntryId ? `${teamData.player1EntryId}:0` : null;
          player2Id = teamData.player2EntryId ? `${teamData.player2EntryId}:0` : null;
          player3Id = null;
          player4Id = null;
          player5Id = null;
          player6Id = null;
        }
        
        const team = await storage.createCompetitionTeam({
          eventId,
          teamNumber: i + 1,
          player1EntryId: player1Id,
          player2EntryId: player2Id,
          player3EntryId: player3Id,
          player4EntryId: player4Id,
          player5EntryId: player5Id,
          player6EntryId: player6Id
        });
        createdTeams.push(team);
      }

      res.json({ message: `Created ${createdTeams.length} teams`, teams: createdTeams });
    } catch (error) {
      console.error("Error saving manual teams:", error);
      res.status(500).json({ error: "Failed to save teams" });
    }
  });

  // Delete all teams
  app.delete("/api/events/:id/teams", isAdmin, async (req: any, res) => {
    try {
      await storage.deleteCompetitionTeams(req.params.id);
      res.json({ message: "Teams deleted" });
    } catch (error) {
      console.error("Error deleting teams:", error);
      res.status(500).json({ error: "Failed to delete teams" });
    }
  });

  // Swap players between teams
  app.post("/api/events/:id/teams/swap", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;
      const { team1Id, team1Slot, team2Id, team2Slot } = req.body;

      if (!team1Id || !team1Slot || !team2Id || !team2Slot) {
        return res.status(400).json({ error: "team1Id, team1Slot, team2Id, and team2Slot are required" });
      }

      // Get both teams
      const team1 = await storage.getCompetitionTeamById(team1Id);
      const team2 = await storage.getCompetitionTeamById(team2Id);

      if (!team1 || !team2) {
        return res.status(404).json({ error: "One or both teams not found" });
      }

      // Verify both teams belong to this event
      if (team1.eventId !== eventId || team2.eventId !== eventId) {
        return res.status(400).json({ error: "Teams do not belong to this event" });
      }

      // Get the player entry IDs from the specified slots
      const slotToField: Record<string, keyof typeof team1> = {
        '1': 'player1EntryId',
        '2': 'player2EntryId',
        '3': 'player3EntryId',
        '4': 'player4EntryId',
        '5': 'player5EntryId',
        '6': 'player6EntryId'
      };

      const field1 = slotToField[team1Slot];
      const field2 = slotToField[team2Slot];

      if (!field1 || !field2) {
        return res.status(400).json({ error: "Invalid slot numbers (must be 1-6)" });
      }

      const player1EntryId = team1[field1];
      const player2EntryId = team2[field2];

      // Swap the players
      await storage.updateCompetitionTeam(team1Id, { [field1]: player2EntryId });
      await storage.updateCompetitionTeam(team2Id, { [field2]: player1EntryId });

      res.json({ message: "Players swapped successfully" });
    } catch (error) {
      console.error("Error swapping players:", error);
      res.status(500).json({ error: "Failed to swap players" });
    }
  });

  // Update team stableford score
  app.patch("/api/events/:id/teams/:teamId/stableford", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const eventId = req.params.id;
      const teamId = req.params.teamId;
      const { teamStableford, teamHandicap } = req.body;

      if (typeof teamStableford !== "number" || teamStableford < 0) {
        return res.status(400).json({ error: "Invalid team stableford score" });
      }

      // Get the team
      const team = await storage.getCompetitionTeamById(teamId);
      if (!team) {
        return res.status(404).json({ error: "Team not found" });
      }

      if (team.eventId !== eventId) {
        return res.status(400).json({ error: "Team does not belong to this event" });
      }

      // Check if user is admin
      const userRecord = await storage.getUserById(userId);
      const isAdmin = userRecord?.isAdmin === true;

      // Check if user is on this team (by checking entries)
      const entries = await storage.getEventEntries(eventId);
      const userEntries = entries.filter(e => e.userId === userId);
      
      // Build list of slot IDs from this team
      const teamSlotIds = [
        team.player1EntryId, team.player2EntryId, team.player3EntryId,
        team.player4EntryId, team.player5EntryId, team.player6EntryId
      ].filter(Boolean);

      // Check if any of the user's entries or assigned players are on this team
      let userIsOnTeam = false;
      for (const entry of userEntries) {
        const count = entry.playerCount || 1;
        for (let i = 0; i < count; i++) {
          const slotId = `${entry.id}:${i}`;
          if (teamSlotIds.includes(slotId)) {
            userIsOnTeam = true;
            break;
          }
        }
        if (userIsOnTeam) break;
      }

      // Also check if user is assigned to any entry on this team
      if (!userIsOnTeam) {
        for (const entry of entries) {
          if (entry.assignedPlayerIds?.includes(userId)) {
            const count = entry.playerCount || 1;
            for (let i = 0; i < count; i++) {
              const slotId = `${entry.id}:${i}`;
              if (teamSlotIds.includes(slotId)) {
                userIsOnTeam = true;
                break;
              }
            }
          }
          if (userIsOnTeam) break;
        }
      }

      if (!isAdmin && !userIsOnTeam) {
        return res.status(403).json({ error: "Only team members or admins can update team stableford" });
      }

      // Update the team stableford and optionally handicap
      const updateData: any = { teamStableford };
      if (typeof teamHandicap === "number" && teamHandicap >= 0) {
        updateData.teamHandicap = teamHandicap;
      } else if (teamHandicap === null || teamHandicap === 0) {
        updateData.teamHandicap = teamHandicap;
      }
      const updatedTeam = await storage.updateCompetitionTeamStableford(teamId, teamStableford, updateData.teamHandicap);
      res.json(updatedTeam);
    } catch (error) {
      console.error("Error updating team stableford:", error);
      res.status(500).json({ error: "Failed to update team stableford" });
    }
  });

  // Generate tee times for competition teams
  app.post("/api/events/:id/generate-tee-times", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;
      const { firstTee, interval, playersPerTeeTime, teamSize } = req.body;

      if (!firstTee || !interval) {
        return res.status(400).json({ error: "First tee time and interval are required" });
      }

      // Validate time format (HH:mm)
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      if (!timeRegex.test(firstTee)) {
        return res.status(400).json({ error: "Invalid time format. Use HH:mm (e.g., 10:00)" });
      }

      // Validate interval
      const validIntervals = [8, 10, 12];
      if (!validIntervals.includes(Number(interval))) {
        return res.status(400).json({ error: "Interval must be 8, 10, or 12 minutes" });
      }

      // Verify this is a team competition
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.eventType !== "team_competition") {
        return res.status(400).json({ error: "Tee times can only be generated for team competitions" });
      }

      // Get all teams for this event, ordered by team number
      const teams = await storage.getCompetitionTeams(eventId);
      if (!teams || teams.length === 0) {
        return res.status(404).json({ error: "No teams found for this event" });
      }

      // Sort teams by team number
      teams.sort((a, b) => a.teamNumber - b.teamNumber);

      // Parse the first tee time
      const [hours, minutes] = firstTee.split(":").map(Number);
      let currentTime = hours * 60 + minutes;

      const effectiveTeamSize = teamSize || event.teamSize || 1;
      const effectivePlayersPerTeeTime = playersPerTeeTime || effectiveTeamSize;
      const teamsPerSlot = Math.max(1, Math.floor(effectivePlayersPerTeeTime / effectiveTeamSize));

      const updates = [];
      for (let i = 0; i < teams.length; i++) {
        const teeHours = Math.floor(currentTime / 60);
        const teeMins = currentTime % 60;
        const teeTime = `${teeHours.toString().padStart(2, "0")}:${teeMins.toString().padStart(2, "0")}`;
        
        await storage.updateCompetitionTeamTeeTime(teams[i].id, teeTime);
        updates.push({ teamId: teams[i].id, teamNumber: teams[i].teamNumber, teeTime });
        
        if ((i + 1) % teamsPerSlot === 0) {
          currentTime += Number(interval);
        }
      }

      res.json({ success: true, teeTimes: updates });
    } catch (error) {
      console.error("Error generating tee times:", error);
      res.status(500).json({ error: "Failed to generate tee times" });
    }
  });

  // Get competition bracket
  app.get("/api/events/:id/bracket", async (req: any, res) => {
    try {
      const eventId = req.params.id;
      const bracket = await storage.getCompetitionBracket(eventId);
      if (!bracket) {
        return res.json({ bracket: null, rounds: [], matches: [] });
      }
      const rounds = await storage.getCompetitionRounds(bracket.id);
      const matches = await storage.getCompetitionMatchesByBracket(bracket.id);
      res.json({ bracket, rounds, matches });
    } catch (error) {
      console.error("Error getting bracket:", error);
      res.status(500).json({ error: "Failed to get bracket" });
    }
  });

  // Create competition bracket
  app.post("/api/events/:id/bracket", isAdmin, async (req: any, res) => {
    try {
      const eventId = req.params.id;

      // Check if event exists
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      // Check if bracket already exists
      const existingBracket = await storage.getCompetitionBracket(eventId);
      if (existingBracket) {
        return res.status(400).json({ error: "Bracket already exists for this event" });
      }

      // Get teams
      const teams = await storage.getCompetitionTeams(eventId);
      if (teams.length < 2) {
        return res.status(400).json({ error: "Need at least 2 teams to create a bracket" });
      }

      const createdRounds = [];
      const createdMatches = [];

      // Team competitions use simple pairings (team 1 v team 2, team 3 v team 4, etc.)
      // Knockout competitions use elimination bracket
      if (event.eventType === "team_competition") {
        // Create a single round with team pairings
        const bracket = await storage.createCompetitionBracket({
          eventId,
          totalRounds: 1
        });

        const round = await storage.createCompetitionRound({
          bracketId: bracket.id,
          roundNumber: 1,
          roundName: "Competition Matches",
          deadline: null
        });
        createdRounds.push(round);

        // Create matches pairing teams: team 1 vs team 2, team 3 vs team 4, etc.
        const numMatches = Math.floor(teams.length / 2);
        for (let m = 1; m <= numMatches; m++) {
          const team1Id = teams[(m - 1) * 2] ? teams[(m - 1) * 2].id : null;
          const team2Id = teams[(m - 1) * 2 + 1] ? teams[(m - 1) * 2 + 1].id : null;

          const match = await storage.createCompetitionMatch({
            roundId: round.id,
            matchNumber: m,
            team1Id,
            team2Id,
            winnerId: null,
            score1: null,
            score2: null
          });
          createdMatches.push(match);
        }
      } else {
        // Knockout bracket - multi-round elimination
        // Calculate number of rounds (log2 of teams, rounded up, minimum 1)
        const totalRounds = Math.max(1, Math.ceil(Math.log2(teams.length)));

        // Create bracket
        const bracket = await storage.createCompetitionBracket({
          eventId,
          totalRounds
        });

        // Generate round names based on total rounds
        const roundNames: string[] = [];
        for (let r = 1; r <= totalRounds; r++) {
          const roundsFromFinal = totalRounds - r;
          if (roundsFromFinal === 0) {
            roundNames.push("Final");
          } else if (roundsFromFinal === 1) {
            roundNames.push("Semi-Final");
          } else if (roundsFromFinal === 2) {
            roundNames.push("Quarter-Final");
          } else {
            roundNames.push(`Round ${r}`);
          }
        }

        let teamsInRound = teams.length;

        for (let roundNum = 1; roundNum <= totalRounds; roundNum++) {
          const matchesInRound = Math.ceil(teamsInRound / 2);
          
          const round = await storage.createCompetitionRound({
            bracketId: bracket.id,
            roundNumber: roundNum,
            roundName: roundNames[roundNum - 1],
            deadline: null
          });
          createdRounds.push(round);

          // Create matches for this round
          for (let m = 1; m <= matchesInRound; m++) {
            // Only first round gets teams assigned
            const team1Id = roundNum === 1 && teams[(m - 1) * 2] ? teams[(m - 1) * 2].id : null;
            const team2Id = roundNum === 1 && teams[(m - 1) * 2 + 1] ? teams[(m - 1) * 2 + 1].id : null;

            const match = await storage.createCompetitionMatch({
              roundId: round.id,
              matchNumber: m,
              team1Id,
              team2Id,
              winnerId: null,
              score1: null,
              score2: null
            });
            createdMatches.push(match);
          }

          teamsInRound = matchesInRound;
        }
      }

      // Send notifications to all participants about the draw
      try {
        // Get first round matches for first match notifications
        const firstRoundMatches = createdMatches.filter(m => {
          const round = createdRounds.find(r => r.id === m.roundId);
          return round && round.roundNumber === 1;
        });

        // Batch load all entries for the event to avoid N+1 queries
        const allEntries = await storage.getEventEntries(eventId);
        const entryMap = new Map(allEntries.map(e => [e.id, e]));

        // Helper to get team name from player slots
        const getTeamName = (team: typeof teams[0]): string => {
          const playerSlots = [
            team.player1EntryId, team.player2EntryId, 
            team.player3EntryId, team.player4EntryId, 
            team.player5EntryId, team.player6EntryId
          ];
          
          for (const slotId of playerSlots) {
            if (slotId) {
              const entryId = slotId.split(':')[0];
              const entry = entryMap.get(entryId);
              if (entry?.teamName) {
                return entry.teamName;
              }
            }
          }
          return `Team ${team.teamNumber}`;
        };

        // Helper to get user IDs from a team's player slots
        const getTeamUserIds = (team: typeof teams[0]): string[] => {
          const userIds: string[] = [];
          const playerSlots = [
            team.player1EntryId, team.player2EntryId, 
            team.player3EntryId, team.player4EntryId, 
            team.player5EntryId, team.player6EntryId
          ];
          
          for (const slotId of playerSlots) {
            if (slotId) {
              const [entryId, slotIndexStr] = slotId.split(':');
              const slotIndex = parseInt(slotIndexStr, 10);
              const entry = entryMap.get(entryId);
              
              if (entry) {
                if (slotIndex === 0) {
                  // Slot 0 is the entry owner
                  if (!userIds.includes(entry.userId)) {
                    userIds.push(entry.userId);
                  }
                } else if (entry.assignedPlayerIds && entry.assignedPlayerIds[slotIndex - 1]) {
                  // Other slots are assigned players
                  const playerId = entry.assignedPlayerIds[slotIndex - 1];
                  if (playerId && !userIds.includes(playerId)) {
                    userIds.push(playerId);
                  }
                }
              }
            }
          }
          return userIds;
        };

        // Build maps for team names and user IDs
        const teamInfoMap = new Map<string, { name: string }>();
        const teamToUsersMap = new Map<string, string[]>();
        
        for (const team of teams) {
          teamInfoMap.set(team.id, { name: getTeamName(team) });
          teamToUsersMap.set(team.id, getTeamUserIds(team));
        }

        // Send notifications for each team
        for (const team of teams) {
          const userIds = teamToUsersMap.get(team.id) || [];
          const teamInfo = teamInfoMap.get(team.id);
          
          // Find the first match for this team
          const firstMatch = firstRoundMatches.find(m => m.team1Id === team.id || m.team2Id === team.id);
          let opponentName = null;
          if (firstMatch) {
            const opponentId = firstMatch.team1Id === team.id ? firstMatch.team2Id : firstMatch.team1Id;
            if (opponentId) {
              const opponentInfo = teamInfoMap.get(opponentId);
              opponentName = opponentInfo?.name || "Unknown";
            }
          }
          
          // Send notifications to all users in this team
          for (const usrId of userIds) {
            try {
              // Team confirmation notification
              await storage.createConnectionNotification({
                userId: usrId,
                type: "team_confirmed",
                eventId,
                teamId: team.id,
                metadata: JSON.stringify({ 
                  eventName: event.name, 
                  eventSlug: event.slug,
                  teamName: teamInfo?.name 
                })
              });
              
              // First match notification
              if (firstMatch) {
                await storage.createConnectionNotification({
                  userId: usrId,
                  type: "first_match",
                  eventId,
                  teamId: team.id,
                  matchId: firstMatch.id,
                  metadata: JSON.stringify({ 
                    eventName: event.name, 
                    eventSlug: event.slug,
                    teamName: teamInfo?.name,
                    opponentName,
                    matchNumber: firstMatch.matchNumber
                  })
                });
              }
            } catch (notifError) {
              console.error("Failed to create notification for user:", usrId, notifError);
              // Continue with other notifications
            }
          }
        }
      } catch (notificationError) {
        console.error("Error sending draw notifications:", notificationError);
        // Don't fail bracket creation if notifications fail
      }

      res.json({
        message: event.eventType === "team_competition" 
          ? "Competition matches created" 
          : "Competition bracket created",
        rounds: createdRounds,
        matches: createdMatches
      });
    } catch (error) {
      console.error("Error creating bracket:", error);
      res.status(500).json({ error: "Failed to create bracket" });
    }
  });

  // Update round deadline
  app.patch("/api/events/:id/rounds/:roundId", isAdmin, async (req: any, res) => {
    try {
      const { roundId } = req.params;
      const { deadline } = req.body;

      // Validate deadline if provided
      let parsedDeadline: Date | null = null;
      if (deadline) {
        parsedDeadline = new Date(deadline);
        if (isNaN(parsedDeadline.getTime())) {
          return res.status(400).json({ error: "Invalid date format" });
        }
      }

      const updated = await storage.updateCompetitionRound(roundId, {
        deadline: parsedDeadline
      });

      if (!updated) {
        return res.status(404).json({ error: "Round not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating round:", error);
      res.status(500).json({ error: "Failed to update round" });
    }
  });

  // Delete bracket
  app.delete("/api/events/:id/bracket", isAdmin, async (req: any, res) => {
    try {
      await storage.deleteCompetitionBracket(req.params.id);
      res.json({ message: "Bracket deleted" });
    } catch (error) {
      console.error("Error deleting bracket:", error);
      res.status(500).json({ error: "Failed to delete bracket" });
    }
  });

  // Update match winner and progress to next round
  app.patch("/api/events/:id/matches/:matchId/winner", isAdmin, async (req: any, res) => {
    try {
      const { matchId } = req.params;
      const { winnerId } = req.body;

      if (!winnerId) {
        return res.status(400).json({ error: "Winner ID is required" });
      }

      // Get bracket data to find the match and its round
      const eventId = req.params.id;
      const bracket = await storage.getCompetitionBracket(eventId);
      if (!bracket) {
        return res.status(404).json({ error: "Bracket not found" });
      }

      const rounds = await storage.getCompetitionRounds(bracket.id);
      const allMatches = await storage.getCompetitionMatchesByBracket(bracket.id);
      
      // Find the match
      const match = allMatches.find(m => m.id === matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Validate winner is one of the teams
      if (winnerId !== match.team1Id && winnerId !== match.team2Id) {
        return res.status(400).json({ error: "Winner must be one of the match teams" });
      }

      // Update the match with the winner
      await storage.updateCompetitionMatch(matchId, { winnerId });

      // Find the current round
      const currentRound = rounds.find(r => r.id === match.roundId);
      if (!currentRound) {
        return res.status(404).json({ error: "Round not found" });
      }

      // Find next round (if exists)
      const nextRound = rounds.find(r => r.roundNumber === currentRound.roundNumber + 1);
      
      if (nextRound) {
        // Calculate which match in the next round this winner goes to
        const nextMatchNumber = Math.ceil(match.matchNumber / 2);
        const nextRoundMatches = allMatches.filter(m => m.roundId === nextRound.id);
        const nextMatch = nextRoundMatches.find(m => m.matchNumber === nextMatchNumber);
        
        if (nextMatch) {
          // Determine if winner goes to team1 or team2 slot
          // Odd match numbers go to team1, even go to team2
          // Also clear the next match's winner since teams may have changed
          if (match.matchNumber % 2 === 1) {
            await storage.updateCompetitionMatch(nextMatch.id, { team1Id: winnerId, winnerId: null });
          } else {
            await storage.updateCompetitionMatch(nextMatch.id, { team2Id: winnerId, winnerId: null });
          }
          
          // Cascade clear winners in all subsequent rounds
          let currentRoundNum = nextRound.roundNumber;
          let currentMatchNum = nextMatchNumber;
          while (currentRoundNum < rounds.length) {
            const furtherRound = rounds.find(r => r.roundNumber === currentRoundNum + 1);
            if (!furtherRound) break;
            
            const furtherMatchNum = Math.ceil(currentMatchNum / 2);
            const furtherMatches = allMatches.filter(m => m.roundId === furtherRound.id);
            const furtherMatch = furtherMatches.find(m => m.matchNumber === furtherMatchNum);
            
            if (furtherMatch && furtherMatch.winnerId) {
              // Clear the team slot and winner
              if (currentMatchNum % 2 === 1) {
                await storage.updateCompetitionMatch(furtherMatch.id, { team1Id: null, winnerId: null });
              } else {
                await storage.updateCompetitionMatch(furtherMatch.id, { team2Id: null, winnerId: null });
              }
            }
            
            currentRoundNum++;
            currentMatchNum = furtherMatchNum;
          }
        }
      }

      // Auto-post to group about the match result
      const roundDisplayName = currentRound.roundName || `Round ${currentRound.roundNumber}`;
      const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
      const isFinalMatch = !nextRound;
      await postMatchResultToGroup(eventId, winnerId, loserId || "", roundDisplayName, req.userId, isFinalMatch);

      if (isFinalMatch) {
        await sendCompetitionWinnerNotification(eventId, winnerId, loserId || "");
      }

      res.json({ message: "Winner updated", winnerId });
    } catch (error) {
      console.error("Error updating match winner:", error);
      res.status(500).json({ error: "Failed to update winner" });
    }
  });

  app.get("/api/events/:id/my-entry", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const entry = await storage.getEventEntryByUserAndEvent(req.params.id, userId);
      if (entry) {
        return res.json({ hasEntered: true, entry });
      }

      const allEntries = await storage.getEventEntries(req.params.id);
      const assignedEntry = allEntries.find(e =>
        e.assignedPlayerIds && e.assignedPlayerIds.includes(userId)
      );
      if (assignedEntry) {
        return res.json({ hasEntered: true, entry: assignedEntry });
      }

      res.json({ hasEntered: false, entry: null });
    } catch (error) {
      console.error("Error checking user entry:", error);
      res.status(500).json({ error: "Failed to check entry status" });
    }
  });

  // Get user's next match in a competition
  app.get("/api/events/:id/my-match", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const eventId = req.params.id;

      // Get bracket
      const bracket = await storage.getCompetitionBracket(eventId);
      if (!bracket) {
        return res.json({ match: null, message: "Competition bracket not created yet" });
      }

      // Get all entries to find user's slots
      const allEntries = await storage.getEventEntries(eventId);
      
      // Find all slot IDs that belong to this user
      // User could be an entry owner (slot format: "entryId:0") or an assigned player (slot format: "entryId:N")
      const userSlotIds: string[] = [];
      
      for (const entry of allEntries) {
        // Check if user is the entry owner - they own slot 0
        if (entry.userId === userId) {
          userSlotIds.push(`${entry.id}:0`);
        }
        
        // Check if user is an assigned player in any slot
        // assignedPlayerIds is an array of user IDs at positions 0, 1, 2... corresponding to slots 1, 2, 3...
        if (entry.assignedPlayerIds) {
          for (let i = 0; i < entry.assignedPlayerIds.length; i++) {
            if (entry.assignedPlayerIds[i] === userId) {
              // Slot index is i+1 since slot 0 is the entry owner
              userSlotIds.push(`${entry.id}:${i + 1}`);
            }
          }
        }
      }
      
      if (userSlotIds.length === 0) {
        return res.json({ match: null, message: "Not entered in this competition" });
      }

      // Find user's team by checking if any of their slot IDs are in a team
      const teams = await storage.getCompetitionTeams(eventId);
      const userTeam = teams.find(t => {
        // Check all player slots in the team
        const teamSlots = [t.player1EntryId, t.player2EntryId, t.player3EntryId, t.player4EntryId, t.player5EntryId, t.player6EntryId];
        return teamSlots.some(slot => slot && userSlotIds.includes(slot));
      });
      
      if (!userTeam) {
        return res.json({ match: null, message: "Not assigned to a team yet" });
      }

      // Get all rounds and matches
      const rounds = await storage.getCompetitionRounds(bracket.id);
      const allMatches = await storage.getCompetitionMatchesByBracket(bracket.id);

      // Find user's current/next match (one they're in but hasn't been decided yet)
      let currentMatch = null;
      let currentRound = null;
      
      for (const round of rounds.sort((a, b) => a.roundNumber - b.roundNumber)) {
        const roundMatches = allMatches.filter(m => m.roundId === round.id);
        for (const match of roundMatches) {
          if ((match.team1Id === userTeam.id || match.team2Id === userTeam.id) && !match.winnerId) {
            currentMatch = match;
            currentRound = round;
            break;
          }
        }
        if (currentMatch) break;
      }

      if (!currentMatch) {
        // Check if user was eliminated
        const lastMatch = allMatches
          .filter(m => m.team1Id === userTeam.id || m.team2Id === userTeam.id)
          .sort((a, b) => {
            const roundA = rounds.find(r => r.id === a.roundId)?.roundNumber || 0;
            const roundB = rounds.find(r => r.id === b.roundId)?.roundNumber || 0;
            return roundB - roundA;
          })[0];
        
        if (lastMatch?.winnerId && lastMatch.winnerId !== userTeam.id) {
          return res.json({ match: null, eliminated: true, message: "Eliminated from competition" });
        }
        if (lastMatch?.winnerId === userTeam.id) {
          const finalRound = rounds.find(r => r.roundNumber === bracket.totalRounds);
          if (finalRound && lastMatch.roundId === finalRound.id) {
            return res.json({ match: null, champion: true, message: "You won the competition!" });
          }
        }
        return res.json({ match: null, message: "No upcoming matches" });
      }

      // Get opponent team info
      const opponentTeamId = currentMatch.team1Id === userTeam.id ? currentMatch.team2Id : currentMatch.team1Id;
      const opponentTeam = opponentTeamId ? teams.find(t => t.id === opponentTeamId) : null;
      
      // Helper to parse slot ID and get player info
      const getSlotInfo = async (slotId: string | null) => {
        if (!slotId) return null;
        const [entryId, slotIndexStr] = slotId.split(':');
        const slotIndex = parseInt(slotIndexStr, 10);
        const entry = allEntries.find(e => e.id === entryId);
        if (!entry) return null;
        
        const getUserInfo = async (userId: string) => {
          const result = await getDb().users.findFirst({
            where: { id: userId },
            select: { id: true, mumblesVibeName: true, profileImageUrl: true }
          });
          return result;
        };
        
        if (slotIndex === 0) {
          // Slot 0 is the entry owner
          const user = await getUserInfo(entry.userId);
          return {
            userId: entry.userId,
            name: user?.mumblesVibeName || entry.playerNames?.[0] || entry.teamName || "Player",
            image: user?.profileImageUrl || null
          };
        } else {
          // Slot 1+ are assigned players (index 0 in assignedPlayerIds = slot 1)
          const assignedUserId = entry.assignedPlayerIds?.[slotIndex - 1];
          if (assignedUserId) {
            const user = await getUserInfo(assignedUserId);
            return {
              userId: assignedUserId,
              name: user?.mumblesVibeName || entry.playerNames?.[slotIndex] || "Player",
              image: user?.profileImageUrl || null
            };
          }
          return { userId: null, name: entry.playerNames?.[slotIndex] || "Player", image: null };
        }
      };
      
      const getTeamPlayerNames = async (team: any) => {
        if (!team) return { players: [] };
        
        const playerSlots = [
          team.player1EntryId, team.player2EntryId, team.player3EntryId,
          team.player4EntryId, team.player5EntryId, team.player6EntryId
        ].filter(Boolean);
        
        const playerInfos = await Promise.all(playerSlots.map(slot => getSlotInfo(slot)));
        
        return {
          players: playerInfos.filter(Boolean).map(p => ({
            userId: p?.userId || null,
            name: p?.name || "TBD",
            image: p?.image || null
          }))
        };
      };

      const yourTeamInfo = await getTeamPlayerNames(userTeam);
      const opponentTeamInfo = opponentTeamId ? await getTeamPlayerNames(opponentTeam) : null;

      // Determine result submission state
      const hasProposedResult = !!currentMatch.proposedWinnerId;
      const submittedByYourTeam = currentMatch.resultSubmittedByTeamId === userTeam.id;
      const proposedWinnerIsYourTeam = currentMatch.proposedWinnerId === userTeam.id;

      res.json({
        match: {
          id: currentMatch.id,
          matchNumber: currentMatch.matchNumber,
          roundName: currentRound?.roundName,
          roundNumber: currentRound?.roundNumber,
          deadline: currentRound?.deadline,
          yourTeam: {
            id: userTeam.id,
            teamNumber: userTeam.teamNumber,
            ...yourTeamInfo
          },
          opponentTeam: opponentTeamId ? {
            id: opponentTeamId,
            teamNumber: opponentTeam?.teamNumber,
            ...opponentTeamInfo
          } : null,
          waitingForOpponent: !opponentTeamId,
          resultSubmission: hasProposedResult ? {
            proposedWinnerId: currentMatch.proposedWinnerId,
            proposedWinnerIsYourTeam,
            submittedByYourTeam,
            awaitingYourConfirmation: !submittedByYourTeam
          } : null
        }
      });
    } catch (error) {
      console.error("Error getting user match:", error);
      res.status(500).json({ error: "Failed to get match info" });
    }
  });

  // Submit match result (any team member can submit)
  app.post("/api/events/:id/matches/:matchId/submit-result", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { matchId } = req.params;
      const { proposedWinnerId } = req.body;

      if (!proposedWinnerId) {
        return res.status(400).json({ error: "Proposed winner is required" });
      }

      // Get the match
      const match = await storage.getCompetitionMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Check if match already has a confirmed winner
      if (match.winnerId) {
        return res.status(400).json({ error: "This match already has a confirmed winner" });
      }

      // Validate the proposed winner is one of the teams
      if (proposedWinnerId !== match.team1Id && proposedWinnerId !== match.team2Id) {
        return res.status(400).json({ error: "Invalid winner - must be one of the competing teams" });
      }

      // Check if user is part of either team
      const bracket = await storage.getCompetitionBracketByRoundId(match.roundId);
      if (!bracket) {
        return res.status(404).json({ error: "Bracket not found" });
      }
      
      const teams = await storage.getCompetitionTeams(bracket.eventId);
      const allEntries = await storage.getEventEntries(bracket.eventId);
      
      // Find all slot IDs that belong to this user
      const userSlotIds: string[] = [];
      for (const entry of allEntries) {
        if (entry.userId === userId) {
          userSlotIds.push(`${entry.id}:0`);
        }
        if (entry.assignedPlayerIds) {
          for (let i = 0; i < entry.assignedPlayerIds.length; i++) {
            if (entry.assignedPlayerIds[i] === userId) {
              userSlotIds.push(`${entry.id}:${i + 1}`);
            }
          }
        }
      }
      
      // Find which team the user belongs to
      const userTeam = teams.find(t => {
        const teamSlots = [t.player1EntryId, t.player2EntryId, t.player3EntryId, t.player4EntryId, t.player5EntryId, t.player6EntryId];
        return teamSlots.some(slot => slot && userSlotIds.includes(slot));
      });

      if (!userTeam || (userTeam.id !== match.team1Id && userTeam.id !== match.team2Id)) {
        return res.status(403).json({ error: "You are not participating in this match" });
      }

      // Update match with proposed result
      await storage.updateCompetitionMatch(matchId, {
        proposedWinnerId,
        resultSubmittedByTeamId: userTeam.id,
        resultSubmittedByUserId: userId
      });

      // Send notification to opposing team members to confirm/dispute the result
      try {
        const event = await storage.getEventById(bracket.eventId);
        const group = event?.linkedGroupId ? await storage.getGroupById(event.linkedGroupId) : null;
        const opposingTeamId = userTeam.id === match.team1Id ? match.team2Id : match.team1Id;
        const opposingTeam = teams.find(t => t.id === opposingTeamId);

        if (opposingTeam && event) {
          const opposingPlayerUserIds = new Set<string>();
          const opposingSlots = [
            opposingTeam.player1EntryId, opposingTeam.player2EntryId,
            opposingTeam.player3EntryId, opposingTeam.player4EntryId,
            opposingTeam.player5EntryId, opposingTeam.player6EntryId
          ];
          for (const slotId of opposingSlots) {
            if (slotId) {
              const [entryId, slotIndexStr] = slotId.split(':');
              const slotIndex = parseInt(slotIndexStr, 10);
              const entry = allEntries.find(e => e.id === entryId);
              if (entry) {
                if (slotIndex === 0) {
                  opposingPlayerUserIds.add(entry.userId);
                } else if (entry.assignedPlayerIds && entry.assignedPlayerIds[slotIndex - 1]) {
                  const pid = entry.assignedPlayerIds[slotIndex - 1];
                  if (!pid.startsWith("guest:")) {
                    opposingPlayerUserIds.add(pid);
                  }
                }
              }
            }
          }

          const submitterUser = await getDb().users.findFirst({ where: { id: userId }, select: { mumblesVibeName: true } });
          const submitterName = submitterUser?.mumblesVibeName || "A player";
          const proposedWinnerTeam = teams.find(t => t.id === proposedWinnerId);
          const proposedWinnerLabel = proposedWinnerTeam ? `Team ${proposedWinnerTeam.teamNumber}` : "their team";

          const metadata = JSON.stringify({
            eventName: event.name,
            eventSlug: event.slug,
            groupSlug: group?.slug,
            submitterName,
            proposedWinnerLabel,
          });

          for (const targetUserId of opposingPlayerUserIds) {
            try {
              await storage.createConnectionNotification({
                userId: targetUserId,
                type: "match_result_submitted",
                eventId: event.id,
                metadata,
              });
            } catch (err) {
              console.error(`Failed to send match result notification to ${targetUserId}:`, err);
            }
          }
        }
      } catch (notifError) {
        console.error("Error sending match result submitted notifications:", notifError);
      }

      res.json({ message: "Result submitted, awaiting opponent confirmation" });
    } catch (error) {
      console.error("Error submitting match result:", error);
      res.status(500).json({ error: "Failed to submit result" });
    }
  });

  // Confirm match result (opposing team member confirms)
  app.post("/api/events/:id/matches/:matchId/confirm-result", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { matchId } = req.params;
      const { confirmed } = req.body;

      // Get the match
      const match = await storage.getCompetitionMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Check if there's a proposed result to confirm
      if (!match.proposedWinnerId || !match.resultSubmittedByTeamId) {
        return res.status(400).json({ error: "No result has been submitted for this match" });
      }

      // Check if match already has a confirmed winner
      if (match.winnerId) {
        return res.status(400).json({ error: "This match already has a confirmed winner" });
      }

      // Check if user is part of the opposing team (not the submitting team)
      const bracket = await storage.getCompetitionBracketByRoundId(match.roundId);
      if (!bracket) {
        return res.status(404).json({ error: "Bracket not found" });
      }
      
      const teams = await storage.getCompetitionTeams(bracket.eventId);
      const allEntries = await storage.getEventEntries(bracket.eventId);
      
      // Find all slot IDs that belong to this user
      const userSlotIds: string[] = [];
      for (const entry of allEntries) {
        if (entry.userId === userId) {
          userSlotIds.push(`${entry.id}:0`);
        }
        if (entry.assignedPlayerIds) {
          for (let i = 0; i < entry.assignedPlayerIds.length; i++) {
            if (entry.assignedPlayerIds[i] === userId) {
              userSlotIds.push(`${entry.id}:${i + 1}`);
            }
          }
        }
      }
      
      // Find which team the user belongs to
      const userTeam = teams.find(t => {
        const teamSlots = [t.player1EntryId, t.player2EntryId, t.player3EntryId, t.player4EntryId, t.player5EntryId, t.player6EntryId];
        return teamSlots.some(slot => slot && userSlotIds.includes(slot));
      });

      if (!userTeam || (userTeam.id !== match.team1Id && userTeam.id !== match.team2Id)) {
        return res.status(403).json({ error: "You are not participating in this match" });
      }

      // User must be from the opposing team (not the one that submitted)
      if (userTeam.id === match.resultSubmittedByTeamId) {
        return res.status(403).json({ error: "Result must be confirmed by the opposing team" });
      }

      if (confirmed) {
        // Confirm the result - set winnerId and progress the bracket
        const winnerId = match.proposedWinnerId;
        
        await storage.updateCompetitionMatch(matchId, {
          winnerId,
          resultConfirmedByUserId: userId,
          resultConfirmedAt: new Date()
        });

        // Progress winner to next round (same logic as admin winner update)
        const rounds = await storage.getCompetitionRounds(bracket.id);
        const allMatches = await storage.getCompetitionMatchesByBracket(bracket.id);
        const currentRound = rounds.find(r => r.id === match.roundId);
        
        if (currentRound) {
          const nextRound = rounds.find(r => r.roundNumber === currentRound.roundNumber + 1);
          if (nextRound) {
            const nextRoundMatches = allMatches.filter(m => m.roundId === nextRound.id);
            const nextMatchNumber = Math.ceil(match.matchNumber / 2);
            const nextMatch = nextRoundMatches.find(m => m.matchNumber === nextMatchNumber);
            
            if (nextMatch) {
              // Determine if winner goes to team1 or team2 slot
              // Odd match numbers go to team1, even go to team2
              // Also clear the next match's winner since teams may have changed
              if (match.matchNumber % 2 === 1) {
                await storage.updateCompetitionMatch(nextMatch.id, { team1Id: winnerId, winnerId: null });
              } else {
                await storage.updateCompetitionMatch(nextMatch.id, { team2Id: winnerId, winnerId: null });
              }
              
              // Cascade clear winners in all subsequent rounds
              let currentRoundNum = nextRound.roundNumber;
              let currentMatchNum = nextMatchNumber;
              while (currentRoundNum < rounds.length) {
                const furtherRound = rounds.find(r => r.roundNumber === currentRoundNum + 1);
                if (!furtherRound) break;
                
                const furtherMatchNum = Math.ceil(currentMatchNum / 2);
                const furtherMatches = allMatches.filter(m => m.roundId === furtherRound.id);
                const furtherMatch = furtherMatches.find(m => m.matchNumber === furtherMatchNum);
                
                if (furtherMatch && furtherMatch.winnerId) {
                  if (currentMatchNum % 2 === 1) {
                    await storage.updateCompetitionMatch(furtherMatch.id, { team1Id: null, winnerId: null });
                  } else {
                    await storage.updateCompetitionMatch(furtherMatch.id, { team2Id: null, winnerId: null });
                  }
                }
                
                currentRoundNum++;
                currentMatchNum = furtherMatchNum;
              }
            }
          }
        }

        // Auto-post to group about the match result
        let isFinalMatch = false;
        if (currentRound) {
          const nextRoundCheck = rounds.find(r => r.roundNumber === currentRound.roundNumber + 1);
          isFinalMatch = !nextRoundCheck;
          const roundDisplayName = currentRound.roundName || `Round ${currentRound.roundNumber}`;
          const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
          await postMatchResultToGroup(bracket.eventId, winnerId, loserId || "", roundDisplayName, userId, isFinalMatch);
        }

        if (isFinalMatch) {
          const loserId = winnerId === match.team1Id ? match.team2Id : match.team1Id;
          await sendCompetitionWinnerNotification(bracket.eventId, winnerId, loserId || "");
        }

        res.json({ message: "Result confirmed, winner recorded" });
      } else {
        // Dispute the result - clear the proposed result
        await storage.updateCompetitionMatch(matchId, {
          proposedWinnerId: null,
          resultSubmittedByTeamId: null,
          resultSubmittedByUserId: null
        });

        res.json({ message: "Result disputed, submission cleared" });
      }
    } catch (error) {
      console.error("Error confirming match result:", error);
      res.status(500).json({ error: "Failed to confirm result" });
    }
  });

  app.post("/api/events/:id/enter", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const eventId = req.params.id;
      const { teamName, playerNames, signupType, playerCount } = req.body;

      // Check if event exists and is a competition (knockout or team_competition)
      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      if (event.eventType !== "knockout" && event.eventType !== "team_competition" && event.eventType !== "individual_competition") {
        return res.status(400).json({ error: "This event does not accept entries" });
      }

      // Check if user has already entered
      const existingEntry = await storage.getEventEntryByUserAndEvent(eventId, userId);
      if (existingEntry) {
        return res.status(400).json({ error: "You have already entered this competition" });
      }

      // Check signup deadline
      if (event.signupDeadline) {
        const deadline = new Date(event.signupDeadline);
        if (new Date() > deadline) {
          return res.status(400).json({ error: "The signup deadline has passed" });
        }
      }

      // Calculate payment amount based on signup type
      const effectivePlayerCount = signupType === "team" ? (event.teamSize || 1) : (playerCount || 1);

      // Check if adding this entry would exceed max entries
      if (event.maxEntries) {
        const currentCount = await storage.getEventEntryCount(eventId);
        if (currentCount >= event.maxEntries) {
          return res.status(400).json({ error: "This competition is full" });
        }
        const remainingPlaces = event.maxEntries - currentCount;
        if (effectivePlayerCount > remainingPlaces) {
          return res.status(400).json({ error: `Only ${remainingPlaces} ${remainingPlaces === 1 ? 'place' : 'places'} remaining in this competition` });
        }
      }
      const paymentAmount = event.entryFee ? Number(event.entryFee) * effectivePlayerCount : null;

      const isPaidEvent = event.stripePriceId && paymentAmount && paymentAmount > 0;

      if (isPaidEvent) {
        const user = await storage.getUserById(userId);
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
          const customer = await stripeService.createCustomer(user.email, user.id, user.mumblesVibeName);
          customerId = customer.id;
          await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
        }

        const entryData = JSON.stringify({
          eventId,
          userId,
          teamName: teamName || null,
          playerNames: playerNames || [],
          paymentAmount: paymentAmount ? String(paymentAmount) : null,
          signupType: signupType || "team",
          playerCount: effectivePlayerCount
        });

        const baseUrl = getFrontendBaseUrl(req);
        const session = await stripeService.createEventEntryCheckout(
          customerId,
          event.stripePriceId,
          eventId,
          event.name,
          effectivePlayerCount,
          entryData,
          `${baseUrl}/events/${event.slug}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
          `${baseUrl}/events/${event.slug}?payment=canceled`
        );

        return res.status(200).json({
          paymentRequired: true,
          checkoutUrl: session.url
        });
      }

      const entry = await storage.createEventEntry({
        eventId,
        userId,
        teamName: teamName || null,
        playerNames: playerNames || [],
        paymentStatus: "confirmed",
        paymentAmount: paymentAmount ? String(paymentAmount) : null,
        signupType: signupType || "team",
        playerCount: effectivePlayerCount
      });

      // Auto-join group if event has an attached group
      let joinedGroup: { id: string; name: string; slug: string } | null = null;
      if (event.isEventGroup) {
        try {
          let groupId = event.linkedGroupId;
          let group;
          
          if (!groupId) {
            const newGroup = await storage.createGroup({
              name: event.name,
              description: `Community group for ${event.name}`,
              imageUrl: event.imageUrl,
              createdBy: userId,
              isPublic: false,
              isActive: true,
              eventId: event.id,
            });
            groupId = newGroup.id;
            group = newGroup;
            await storage.updateEvent(event.id, { linkedGroupId: groupId });
          } else {
            group = await storage.getGroupById(groupId);
          }
          
          if (group) {
            const existingMembership = await storage.getGroupMembership(group.id, userId);
            if (!existingMembership) {
              await storage.createGroupMembership({
                groupId: group.id,
                userId,
                role: "member",
                status: "approved"
              });
            }
            joinedGroup = { id: group.id, name: group.name, slug: group.slug };
          }
        } catch (groupError) {
          console.error("Error auto-joining group:", groupError);
        }
      }

      try {
        await storage.createConnectionNotification({
          userId,
          type: "competition_entry",
          eventId: event.id,
          metadata: JSON.stringify({ eventName: event.name, eventSlug: event.slug })
        });
      } catch (notifError) {
        console.error("Failed to create competition entry notification:", notifError);
      }

      res.status(201).json({ 
        ...entry, 
        joinedGroup,
        placesReserved: effectivePlayerCount,
        paymentRequired: false
      });
    } catch (error) {
      console.error("Error entering event:", error);
      res.status(500).json({ error: "Failed to enter event" });
    }
  });

  app.post("/api/events/:id/verify-payment", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const eventId = req.params.id;
      const { sessionId } = req.body;

      if (!sessionId) {
        return res.status(400).json({ error: "Missing session ID" });
      }

      const existingEntry = await storage.getEventEntryByUserAndEvent(eventId, userId);
      if (existingEntry) {
        return res.status(200).json({ alreadyProcessed: true, entry: existingEntry });
      }

      const stripe = (await import('./stripeClient')).getUncachableStripeClient;
      const stripeClient = await stripe();
      const session = await stripeClient.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return res.status(400).json({ error: "Payment not completed" });
      }

      if (session.metadata?.type !== 'event_entry' || session.metadata?.eventId !== eventId) {
        return res.status(400).json({ error: "Session does not match this event" });
      }

      let entryInfo;
      try {
        entryInfo = JSON.parse(session.metadata.entryData || '{}');
      } catch {
        return res.status(400).json({ error: "Invalid entry data" });
      }

      if (entryInfo.userId !== userId) {
        return res.status(403).json({ error: "Session does not belong to this user" });
      }

      const event = await storage.getEventById(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }

      const effectivePlayerCount = entryInfo.playerCount || 1;

      if (event.maxEntries) {
        const currentCount = await storage.getEventEntryCount(eventId);
        if (currentCount + effectivePlayerCount > event.maxEntries) {
          return res.status(400).json({ error: "Event is full" });
        }
      }

      const entry = await storage.createEventEntry({
        eventId: entryInfo.eventId,
        userId: entryInfo.userId,
        teamName: entryInfo.teamName || null,
        playerNames: entryInfo.playerNames || [],
        paymentStatus: 'confirmed',
        paymentAmount: entryInfo.paymentAmount || null,
        signupType: entryInfo.signupType || 'team',
        playerCount: effectivePlayerCount
      });

      if (event.isEventGroup) {
        try {
          let groupId = event.linkedGroupId;
          
          if (!groupId) {
            const newGroup = await storage.createGroup({
              name: event.name,
              description: `Community group for ${event.name}`,
              imageUrl: event.imageUrl || "",
              createdBy: userId,
              isPublic: false,
              isActive: true,
              eventId: event.id,
            });
            groupId = newGroup.id;
            await storage.updateEvent(event.id, { linkedGroupId: groupId });
          }
          
          if (groupId) {
            const isMember = await storage.isGroupMember(groupId, userId);
            if (!isMember) {
              await storage.joinGroup(groupId, userId);
            }
          }
        } catch (groupError) {
          console.error("Failed to auto-join group after payment verification:", groupError);
        }
      }

      try {
        await storage.createNotification({
          userId,
          type: 'competition_entry',
          title: `Competition Entry Confirmed`,
          message: `Your payment has been confirmed and you are now entered in ${event.name}`,
          metadata: JSON.stringify({ eventName: event.name, eventSlug: event.slug })
        });
      } catch (notifError) {
        console.error("Failed to create notification:", notifError);
      }

      console.log(`Payment verified and entry created for user ${userId} in event ${eventId} via session ${sessionId}`);
      res.status(201).json({ entry, verified: true });
    } catch (error: any) {
      console.error("Error verifying payment:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.delete("/api/events/:id/entries/:entryId", isAdmin, async (req, res) => {
    try {
      const eventId = req.params.id;
      const entry = await storage.getEventEntryById(req.params.entryId);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      const deleted = await storage.deleteEventEntry(req.params.entryId);
      if (!deleted) {
        return res.status(404).json({ error: "Entry not found" });
      }

      // Remove entry owner and assigned players from competition group if they're no longer on any other entry
      const event = await storage.getEventById(eventId);
      if (event?.linkedGroupId) {
        const playersToCheck = [entry.userId, ...(entry.assignedPlayerIds || [])].filter(
          (id): id is string => !!id && !id.startsWith("guest:")
        );
        const remainingEntries = await storage.getEventEntries(eventId);
        for (const playerId of playersToCheck) {
          const stillInEvent = remainingEntries.some(e => {
            if (e.userId === playerId) return true;
            if (e.assignedPlayerIds?.includes(playerId)) return true;
            return false;
          });
          if (!stillInEvent) {
            try {
              await storage.leaveGroup(event.linkedGroupId, playerId);
            } catch (leaveError) {
              console.error("Error removing player from group after entry deletion:", leaveError);
            }
          }
        }
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event entry:", error);
      res.status(500).json({ error: "Failed to delete entry" });
    }
  });

  // Update assigned players on an entry (for users to assign community members to their reserved places)
  app.patch("/api/events/:id/entries/:entryId/assign-player", isAuthenticated, async (req: any, res) => {
    try {
      const { entryId } = req.params;
      const eventId = req.params.id;
      const { placeIndex, assignedUserId } = req.body;
      const userId = req.userId;

      // Get the entry
      const entries = await storage.getEventEntries(eventId);
      const entry = entries.find(e => e.id === entryId);
      
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      // Check if user is admin
      const requestingUser = await storage.getUserById(userId);
      const isAdmin = requestingUser?.isAdmin === true;

      // Verify the user owns this entry (admins can manage any entry)
      if (entry.userId !== userId && !isAdmin) {
        return res.status(403).json({ error: "You can only manage your own entry" });
      }

      // Check if competition has started - lock player assignments (admins can still change)
      const event = await storage.getEventById(eventId);
      if (event && new Date() > new Date(event.startDate) && !isAdmin) {
        return res.status(403).json({ error: "Player selections are locked as the competition has started" });
      }

      // Verify placeIndex is valid (0 is the owner, 1+ are additional places)
      const playerCount = entry.playerCount || 1;
      if (placeIndex < 1 || placeIndex >= playerCount) {
        return res.status(400).json({ error: "Invalid place index" });
      }

      // Check if this player is already entered or assigned in another entry
      const isGuest = assignedUserId?.startsWith("guest:");
      if (assignedUserId && !isGuest) {
        for (const e of entries) {
          if (e.userId === assignedUserId) {
            return res.status(400).json({ error: "This player has already entered the competition" });
          }
          if (e.id !== entryId && e.assignedPlayerIds) {
            if (e.assignedPlayerIds.includes(assignedUserId)) {
              return res.status(400).json({ error: "This player is already assigned to another entry" });
            }
          }
        }
      }

      // Update the assigned players array
      const currentAssigned = entry.assignedPlayerIds || [];
      const previouslyAssignedUserId = currentAssigned[placeIndex - 1] || "";
      const newAssigned = [...currentAssigned];
      
      // Ensure array is long enough
      while (newAssigned.length < playerCount - 1) {
        newAssigned.push("");
      }
      
      // Set the assigned player (placeIndex 1 = array index 0, etc.)
      newAssigned[placeIndex - 1] = assignedUserId || "";
      
      const isPreviousGuest = previouslyAssignedUserId?.startsWith("guest:");
      
      const updated = await storage.updateEventEntry(entryId, {
        assignedPlayerIds: newAssigned
      });

      // Send removal notification if a player was previously assigned and is being replaced/removed (skip for guests)
      if (previouslyAssignedUserId && previouslyAssignedUserId !== assignedUserId && !isPreviousGuest) {
        try {
          const event = await storage.getEventById(eventId);
          const group = event?.linkedGroupId ? await storage.getGroupById(event.linkedGroupId) : null;
          await storage.createConnectionNotification({
            userId: previouslyAssignedUserId,
            type: "competition_removed",
            fromUserId: userId,
            eventId: eventId,
            metadata: JSON.stringify({
              eventName: event?.name || "a competition",
              eventSlug: event?.slug || "",
              groupSlug: group?.slug || "",
              groupName: group?.name || ""
            })
          });

          // Remove the old player from the competition group if they're no longer on any entry
          if (event?.linkedGroupId) {
            const allEntries = await storage.getEventEntries(eventId);
            const stillInEvent = allEntries.some(e => {
              if (e.userId === previouslyAssignedUserId) return true;
              if (e.assignedPlayerIds?.includes(previouslyAssignedUserId)) return true;
              return false;
            });
            if (!stillInEvent) {
              try {
                await storage.leaveGroup(event.linkedGroupId, previouslyAssignedUserId);
              } catch (leaveError) {
                console.error("Error removing replaced player from group:", leaveError);
              }
            }
          }
        } catch (notifError) {
          console.error("Failed to create competition_removed notification:", notifError);
        }
      }

      // Add the assigned user to the competition group if one exists (skip for guests)
      if (assignedUserId && !isGuest) {
        const event = await storage.getEventById(eventId);
        if (event?.linkedGroupId) {
          try {
            const existingMembership = await storage.getGroupMembership(event.linkedGroupId, assignedUserId);
            if (!existingMembership) {
              await storage.createGroupMembership({
                groupId: event.linkedGroupId,
                userId: assignedUserId,
                status: "approved"
              });
            }
          } catch (groupError) {
            console.error("Error adding assigned player to group:", groupError);
          }
        }

        // Send notification to the assigned player
        try {
          const group = event?.linkedGroupId ? await storage.getGroupById(event.linkedGroupId) : null;
          const eventDate = event ? new Date(event.startDate) : null;
          const formattedDate = eventDate ? eventDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" }) : "";
          const formattedTime = eventDate ? eventDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";
          await storage.createConnectionNotification({
            userId: assignedUserId,
            type: "competition_added",
            fromUserId: userId,
            eventId: eventId,
            metadata: JSON.stringify({
              eventName: event?.name || "a competition",
              eventSlug: event?.slug || "",
              eventDate: formattedDate,
              eventTime: formattedTime,
              groupSlug: group?.slug || "",
              groupName: group?.name || ""
            })
          });
        } catch (notifError) {
          console.error("Failed to create competition_added notification:", notifError);
        }
      }

      res.json(updated);
    } catch (error) {
      console.error("Error assigning player:", error);
      res.status(500).json({ error: "Failed to assign player" });
    }
  });

  // Submit score for a competition entry (supports per-player scoring via slotIndex)
  app.patch("/api/events/:id/entries/:entryId/score", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const eventId = req.params.id;
      const entryId = req.params.entryId;
      const { score, slotIndex, handicap } = req.body;

      if (typeof score !== "number" || score < 0) {
        return res.status(400).json({ error: "Invalid score" });
      }

      // Get the entry
      const entry = await storage.getEventEntryById(entryId);
      if (!entry) {
        return res.status(404).json({ error: "Entry not found" });
      }

      // Check that the entry belongs to this event
      if (entry.eventId !== eventId) {
        return res.status(400).json({ error: "Entry does not belong to this event" });
      }

      // Check if user is admin
      const userRecord = await storage.getUserById(userId);
      const isAdmin = userRecord?.isAdmin === true;

      // Check that the user owns this entry, is an assigned player on it, or is admin
      const isEntryOwner = entry.userId === userId;
      const isAssignedPlayer = entry.assignedPlayerIds?.includes(userId) || false;
      if (!isEntryOwner && !isAssignedPlayer && !isAdmin) {
        return res.status(403).json({ error: "You can only submit scores for your own entry" });
      }

      // If slotIndex is provided, update playerScores for that specific slot
      if (typeof slotIndex === "number" && slotIndex >= 0) {
        const currentPlayerScores = (entry.playerScores as Record<number, number>) || {};
        const updatedPlayerScores = { ...currentPlayerScores, [slotIndex]: score };
        const updateData: any = { playerScores: updatedPlayerScores };
        if (typeof handicap === "number" && handicap >= 0) {
          const currentPlayerHandicaps = (entry.playerHandicaps as Record<number, number>) || {};
          updateData.playerHandicaps = { ...currentPlayerHandicaps, [slotIndex]: handicap };
        }
        const updatedEntry = await storage.updateEventEntry(entryId, updateData);
        res.json(updatedEntry);
      } else {
        const updateData: any = { score };
        if (typeof handicap === "number" && handicap >= 0) {
          const currentPlayerHandicaps = (entry.playerHandicaps as Record<number, number>) || {};
          updateData.playerHandicaps = { ...currentPlayerHandicaps, [0]: handicap };
        }
        const updatedEntry = await storage.updateEventEntry(entryId, updateData);
        res.json(updatedEntry);
      }
    } catch (error) {
      console.error("Error submitting score:", error);
      res.status(500).json({ error: "Failed to submit score" });
    }
  });

  app.get("/api/event-suggestions", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      if (status && eventSuggestionStatus.includes(status as any)) {
        const suggestions = await storage.getEventSuggestions(status as any);
        return res.json(suggestions);
      }
      const suggestions = await storage.getEventSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching event suggestions:", error);
      res.status(500).json({ error: "Failed to fetch event suggestions" });
    }
  });

  app.post("/api/event-suggestions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const data = insertEventSuggestionSchema.parse({ ...req.body, userId });
      const suggestion = await storage.createEventSuggestion(data);
      res.status(201).json(suggestion);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid event suggestion data", details: error.errors });
      }
      console.error("Error creating event suggestion:", error);
      res.status(500).json({ error: "Failed to create event suggestion" });
    }
  });

  app.patch("/api/admin/event-suggestions/:id/approve", isAdmin, async (req: any, res) => {
    try {
      const userId = req.userId;
      const event = await storage.approveEventSuggestion(req.params.id, userId);
      if (!event) {
        return res.status(404).json({ error: "Event suggestion not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error approving event suggestion:", error);
      res.status(500).json({ error: "Failed to approve event suggestion" });
    }
  });

  app.patch("/api/admin/event-suggestions/:id/reject", isAdmin, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { rejectionReason } = req.body;
      const suggestion = await storage.updateEventSuggestionStatus(
        req.params.id, 
        "rejected", 
        userId, 
        rejectionReason
      );
      if (!suggestion) {
        return res.status(404).json({ error: "Event suggestion not found" });
      }
      res.json(suggestion);
    } catch (error) {
      console.error("Error rejecting event suggestion:", error);
      res.status(500).json({ error: "Failed to reject event suggestion" });
    }
  });

  app.get("/api/reviews", async (req, res) => {
    try {
      const reviews = await storage.getApprovedReviews();
      const reviewsWithAuthors = await Promise.all(
        reviews.map(async (review) => {
          const user = await getDb().users.findFirst({ where: { id: review.userId } });
          return {
            ...review,
            authorName: user?.mumblesVibeName || "Anonymous Viber",
            authorProfileImageUrl: user?.profileImageUrl || null
          };
        })
      );
      res.json(reviewsWithAuthors);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.get("/api/reviews/:slug", async (req, res) => {
    try {
      const review = await storage.getReviewBySlug(req.params.slug);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      if (review.status !== "approved") {
        return res.status(404).json({ error: "Review not found" });
      }
      const user = await getDb().users.findFirst({ where: { id: review.userId } });
      res.json({
        ...review,
        authorName: user?.mumblesVibeName || "Anonymous Viber",
        authorProfileImageUrl: user?.profileImageUrl || null
      });
    } catch (error) {
      console.error("Error fetching review:", error);
      res.status(500).json({ error: "Failed to fetch review" });
    }
  });

  app.post("/api/reviews", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const data = insertMemberReviewSchema.parse({ ...req.body, userId });
      const review = await storage.createReview(data);
      res.status(201).json(review);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid review data", details: error.errors });
      }
      console.error("Error creating review:", error);
      res.status(500).json({ error: "Failed to create review" });
    }
  });

  app.get("/api/admin/reviews", isAdmin, async (req, res) => {
    try {
      const status = req.query.status as string | undefined;
      const reviews = await storage.getReviewsByStatus(status as any);
      const reviewsWithAuthors = await Promise.all(
        reviews.map(async (review) => {
          const user = await getDb().users.findFirst({ where: { id: review.userId } });
          return {
            ...review,
            authorName: user?.mumblesVibeName || "Anonymous Viber",
            authorProfileImageUrl: user?.profileImageUrl || null
          };
        })
      );
      res.json(reviewsWithAuthors);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });

  app.patch("/api/admin/reviews/:id", isAdmin, async (req: any, res) => {
    try {
      const review = await storage.updateReview(req.params.id, req.body);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error updating review:", error);
      res.status(500).json({ error: "Failed to update review" });
    }
  });

  app.patch("/api/admin/reviews/:id/approve", isAdmin, async (req: any, res) => {
    try {
      const userId = req.userId;
      const review = await storage.approveReview(req.params.id, userId);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error approving review:", error);
      res.status(500).json({ error: "Failed to approve review" });
    }
  });

  app.patch("/api/admin/reviews/:id/reject", isAdmin, async (req: any, res) => {
    try {
      const userId = req.userId;
      const review = await storage.rejectReview(req.params.id, userId);
      if (!review) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json(review);
    } catch (error) {
      console.error("Error rejecting review:", error);
      res.status(500).json({ error: "Failed to reject review" });
    }
  });

  app.delete("/api/admin/reviews/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteReview(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Review not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review:", error);
      res.status(500).json({ error: "Failed to delete review" });
    }
  });

  // Review Likes
  app.get("/api/reviews/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getReviewLikes(req.params.id);
      res.json({ count: likes.length });
    } catch (error) {
      console.error("Error fetching review likes:", error);
      res.status(500).json({ error: "Failed to fetch likes" });
    }
  });

  app.get("/api/reviews/:id/liked", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const liked = await storage.hasUserLikedReview(req.params.id, userId);
      res.json({ liked });
    } catch (error) {
      console.error("Error checking review like status:", error);
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  app.post("/api/reviews/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isNowLiked = await storage.toggleReviewLike(req.params.id, userId);
      const likes = await storage.getReviewLikes(req.params.id);
      res.json({ liked: isNowLiked, count: likes.length });
    } catch (error) {
      console.error("Error toggling review like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  // Review Comments
  app.get("/api/reviews/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getReviewComments(req.params.id);
      const commentsWithNames = await Promise.all(
        comments.map(async (comment) => {
          const user = await getDb().users.findFirst({ where: { id: comment.userId } });
          return {
            ...comment,
            authorName: user?.mumblesVibeName || "Anonymous Viber",
            authorProfileImageUrl: user?.profileImageUrl || null
          };
        })
      );
      res.json(commentsWithNames);
    } catch (error) {
      console.error("Error fetching review comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/reviews/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const reviewId = req.params.id;
      const user = await getDb().users.findFirst({ where: { id: userId } });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const parentCommentId = req.body.parentCommentId || null;
      if (parentCommentId) {
        const parentComment = await storage.getReviewCommentById(parentCommentId);
        if (!parentComment) {
          return res.status(400).json({ error: "Parent comment not found" });
        }
        if (parentComment.reviewId !== reviewId) {
          return res.status(400).json({ error: "Parent comment belongs to different review" });
        }
      }

      const comment = await storage.createReviewComment({
        reviewId,
        userId,
        content: req.body.content,
        parentCommentId
      });

      res.status(201).json({
        ...comment,
        authorName: user.mumblesVibeName || "Anonymous Viber",
        authorProfileImageUrl: user.profileImageUrl || null
      });
    } catch (error) {
      console.error("Error creating review comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.patch("/api/reviews/:reviewId/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const comment = await storage.getReviewCommentById(req.params.commentId);
      
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ error: "You can only edit your own comments" });
      }

      const createdAt = comment.createdAt ? new Date(comment.createdAt) : new Date();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      if (createdAt < fiveMinutesAgo) {
        return res.status(403).json({ error: "Comments can only be edited within 5 minutes of posting" });
      }

      const updated = await storage.updateReviewComment(req.params.commentId, userId, req.body.content);
      if (!updated) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      const user = await getDb().users.findFirst({ where: { id: userId } });
      res.json({
        ...updated,
        authorName: user?.mumblesVibeName || "Anonymous Viber",
        authorProfileImageUrl: user?.profileImageUrl || null
      });
    } catch (error) {
      console.error("Error updating review comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/reviews/:reviewId/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const comment = await storage.getReviewCommentById(req.params.commentId);
      
      if (!comment) {
        return res.status(404).json({ error: "Comment not found" });
      }
      
      if (comment.userId !== userId) {
        return res.status(403).json({ error: "You can only delete your own comments" });
      }

      const deleted = await storage.deleteReviewComment(req.params.commentId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.get("/api/polls", optionalAuth, async (req: any, res) => {
    try {
      const polls = await storage.getActivePolls();
      const userId = (req as any).userId;
      const pollsWithVotes = await Promise.all(
        polls.map(async (poll) => {
          const options = poll.options as string[];
          const boostedVotes = poll.boostedVotes || 0;
          
          if (poll.pollType === "ranking") {
            const rankingVotes = await storage.getRankingVotes(poll.id);
            const scores = options.map(() => 0);
            rankingVotes.forEach(vote => {
              const ranking = vote.ranking as number[];
              ranking.forEach((optionIndex, position) => {
                scores[optionIndex] += options.length - position;
              });
            });
            let userRanking: number[] | null = null;
            if (userId) {
              const userVote = await storage.getUserRankingVote(poll.id, userId);
              userRanking = userVote ? userVote.ranking as number[] : null;
            }
            return {
              ...poll,
              rankingScores: scores,
              actualVotes: rankingVotes.length,
              totalVotes: rankingVotes.length + boostedVotes,
              userRanking
            };
          } else {
            const votes = await storage.getPollVotes(poll.id);
            const voteCounts = options.map((_, index) => 
              votes.filter(v => v.optionIndex === index).length
            );
            let userVoteIndex: number | null = null;
            if (userId) {
              const userVote = await storage.getUserVoteForPoll(poll.id, userId);
              userVoteIndex = userVote?.optionIndex ?? null;
            }
            return {
              ...poll,
              voteCounts,
              actualVotes: votes.length,
              totalVotes: votes.length + boostedVotes,
              userVoteIndex
            };
          }
        })
      );
      res.json(pollsWithVotes);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ error: "Failed to fetch polls" });
    }
  });

  app.get("/api/polls/slug/:slug", optionalAuth, async (req: any, res) => {
    try {
      const poll = await storage.getPollBySlug(req.params.slug);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const options = poll.options as string[];
      const boostedVotes = poll.boostedVotes || 0;
      const userId = (req as any).userId;
      
      if (poll.pollType === "ranking") {
        const rankingVotes = await storage.getRankingVotes(poll.id);
        const scores = options.map(() => 0);
        rankingVotes.forEach(vote => {
          const ranking = vote.ranking as number[];
          ranking.forEach((optionIndex, position) => {
            scores[optionIndex] += options.length - position;
          });
        });
        let userRanking: number[] | null = null;
        if (userId) {
          const userVote = await storage.getUserRankingVote(poll.id, userId);
          userRanking = userVote ? userVote.ranking as number[] : null;
        }
        res.json({
          ...poll,
          rankingScores: scores,
          actualVotes: rankingVotes.length,
          totalVotes: rankingVotes.length + boostedVotes,
          userRanking
        });
      } else {
        const votes = await storage.getPollVotes(poll.id);
        const voteCounts = options.map((_, index) => 
          votes.filter(v => v.optionIndex === index).length
        );
        let userVoteIndex: number | null = null;
        if (userId) {
          const userVote = await storage.getUserVoteForPoll(poll.id, userId);
          userVoteIndex = userVote?.optionIndex ?? null;
        }
        res.json({
          ...poll,
          voteCounts,
          actualVotes: votes.length,
          totalVotes: votes.length + boostedVotes,
          userVoteIndex
        });
      }
    } catch (error) {
      console.error("Error fetching poll by slug:", error);
      res.status(500).json({ error: "Failed to fetch poll" });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      const votes = await storage.getPollVotes(poll.id);
      const voteCounts = (poll.options as string[]).map((_, index) => 
        votes.filter(v => v.optionIndex === index).length
      );
      const boostedVotes = poll.boostedVotes || 0;
      res.json({
        ...poll,
        voteCounts,
        actualVotes: votes.length,
        totalVotes: votes.length + boostedVotes
      });
    } catch (error) {
      console.error("Error fetching poll:", error);
      res.status(500).json({ error: "Failed to fetch poll" });
    }
  });

  app.get("/api/polls/:id/user-vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const vote = await storage.getUserVoteForPoll(req.params.id, userId);
      res.json({ hasVoted: !!vote, optionIndex: vote?.optionIndex ?? null });
    } catch (error) {
      console.error("Error fetching user vote:", error);
      res.status(500).json({ error: "Failed to fetch user vote" });
    }
  });

  app.post("/api/polls/:id/vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { optionIndex } = req.body;
      
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      
      const now = new Date();
      const endDate = new Date(poll.startDate.getTime() + poll.durationHours * 60 * 60 * 1000);
      if (now < poll.startDate || now > endDate) {
        return res.status(400).json({ error: "Poll is not currently active" });
      }
      
      const existingVote = await storage.getUserVoteForPoll(req.params.id, userId);
      if (existingVote) {
        return res.status(400).json({ error: "You have already voted on this poll" });
      }
      
      if (optionIndex < 0 || optionIndex >= (poll.options as string[]).length) {
        return res.status(400).json({ error: "Invalid option selected" });
      }
      
      const vote = await storage.votePoll(req.params.id, userId, optionIndex);
      res.json(vote);
    } catch (error) {
      console.error("Error voting on poll:", error);
      res.status(500).json({ error: "Failed to vote on poll" });
    }
  });

  app.post("/api/polls/:id/ranking-vote", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { ranking } = req.body;
      
      const poll = await storage.getPollById(req.params.id);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      
      if (poll.pollType !== "ranking") {
        return res.status(400).json({ error: "This poll does not accept rankings" });
      }
      
      const now = new Date();
      const endDate = new Date(poll.startDate.getTime() + poll.durationHours * 60 * 60 * 1000);
      if (now < poll.startDate || now > endDate) {
        return res.status(400).json({ error: "Poll is not currently active" });
      }
      
      const existingVote = await storage.getUserRankingVote(req.params.id, userId);
      if (existingVote) {
        return res.status(400).json({ error: "You have already voted on this poll" });
      }
      
      const options = poll.options as string[];
      if (!Array.isArray(ranking) || ranking.length !== options.length) {
        return res.status(400).json({ error: "Invalid ranking - must rank all options" });
      }
      
      const sortedRanking = [...ranking].sort((a, b) => a - b);
      const expected = options.map((_, i) => i);
      if (JSON.stringify(sortedRanking) !== JSON.stringify(expected)) {
        return res.status(400).json({ error: "Invalid ranking - must include each option exactly once" });
      }
      
      const vote = await storage.voteRankingPoll(req.params.id, userId, ranking);
      res.json(vote);
    } catch (error) {
      console.error("Error voting on ranking poll:", error);
      res.status(500).json({ error: "Failed to vote on poll" });
    }
  });

  app.get("/api/admin/polls", isAdmin, async (req, res) => {
    try {
      const polls = await storage.getPolls();
      const pollsWithVotes = await Promise.all(
        polls.map(async (poll) => {
          const votes = await storage.getPollVotes(poll.id);
          const boostedVotes = poll.boostedVotes || 0;
          return {
            ...poll,
            totalVotes: votes.length + boostedVotes
          };
        })
      );
      res.json(pollsWithVotes);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ error: "Failed to fetch polls" });
    }
  });

  app.post("/api/admin/polls", isAdmin, async (req, res) => {
    try {
      const body = {
        ...req.body,
        startDate: new Date(req.body.startDate),
      };
      const data = insertPollSchema.parse(body);
      const poll = await storage.createPoll(data);
      res.json(poll);
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ error: "Failed to create poll" });
    }
  });

  app.put("/api/admin/polls/:id", isAdmin, async (req, res) => {
    try {
      const body = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
      };
      const poll = await storage.updatePoll(req.params.id, body);
      if (!poll) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json(poll);
    } catch (error) {
      console.error("Error updating poll:", error);
      res.status(500).json({ error: "Failed to update poll" });
    }
  });

  app.delete("/api/admin/polls/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deletePoll(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Poll not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting poll:", error);
      res.status(500).json({ error: "Failed to delete poll" });
    }
  });

  app.get("/api/admin/vibes", isAdmin, async (req, res) => {
    try {
      const allVibes = await storage.getVibes();
      const vibesWithAuthor = await Promise.all(
        allVibes.map(async (vibe) => {
          const user = await getDb().users.findFirst({ where: { id: vibe.userId } });
          return {
            ...vibe,
            authorName: user?.mumblesVibeName || "Unknown",
            authorProfileImageUrl: user?.profileImageUrl || null
          };
        })
      );
      res.json(vibesWithAuthor);
    } catch (error) {
      console.error("Error fetching vibes:", error);
      res.status(500).json({ error: "Failed to fetch vibes" });
    }
  });

  app.put("/api/admin/vibes/:id", isAdmin, async (req, res) => {
    try {
      const { content, imageUrls } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content is required" });
      }
      const validImageUrls = imageUrls !== undefined && Array.isArray(imageUrls) ? imageUrls : undefined;
      const vibe = await storage.adminUpdateVibe(req.params.id, content, validImageUrls);
      if (!vibe) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json(vibe);
    } catch (error) {
      console.error("Error updating vibe:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.delete("/api/admin/vibes/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.adminDeleteVibe(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Post not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vibe:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.get("/api/newsletter/subscriptions", isAdmin, async (req, res) => {
    try {
      const subscriptions = await storage.getNewsletterSubscriptions();
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ error: "Failed to fetch subscriptions" });
    }
  });

  // Contact request routes
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, phone, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: "Name, email, and message are required" });
      }
      const contactRequest = await storage.createContactRequest({
        name,
        email,
        phone: phone || null,
        message,
        type: "Contact Form"
      });
      res.status(201).json(contactRequest);
    } catch (error) {
      console.error("Error creating contact request:", error);
      res.status(500).json({ error: "Failed to submit contact request" });
    }
  });

  app.get("/api/admin/contact-requests", isAdmin, async (req, res) => {
    try {
      const requests = await storage.getContactRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching contact requests:", error);
      res.status(500).json({ error: "Failed to fetch contact requests" });
    }
  });

  app.patch("/api/admin/contact-requests/:id/read", isAdmin, async (req, res) => {
    try {
      const request = await storage.markContactRequestRead(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Contact request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error marking contact request as read:", error);
      res.status(500).json({ error: "Failed to update contact request" });
    }
  });

  app.delete("/api/admin/contact-requests/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteContactRequest(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Contact request not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting contact request:", error);
      res.status(500).json({ error: "Failed to delete contact request" });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const data = insertNewsletterSchema.parse(req.body);
      const subscription = await storage.subscribeNewsletter(data);
      res.status(201).json(subscription);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid email", details: error.errors });
      }
      console.error("Error subscribing to newsletter:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  app.post("/api/upload", isAdmin, sirvUpload.single("file"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file provided" });
      }

      const url = await sirvService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype
      );

      res.json({ url, objectPath: url });
    } catch (error) {
      console.error("Error uploading to Sirv:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  app.get("/api/hero-settings", async (req, res) => {
    try {
      const settings = await storage.getHeroSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching hero settings:", error);
      res.status(500).json({ error: "Failed to fetch hero settings" });
    }
  });

  app.put("/api/hero-settings", isAdmin, async (req, res) => {
    try {
      const data = insertHeroSettingsSchema.parse(req.body);
      const settings = await storage.updateHeroSettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid hero settings", details: error.errors });
      }
      console.error("Error updating hero settings:", error);
      res.status(500).json({ error: "Failed to update hero settings" });
    }
  });

  // Site Settings (public read, admin write)
  app.get("/api/site-settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching site settings:", error);
      res.status(500).json({ error: "Failed to fetch site settings" });
    }
  });

  app.put("/api/site-settings", isAdmin, async (req, res) => {
    try {
      const { updateSiteSettingsSchema } = await import("@shared/schema");
      const data = updateSiteSettingsSchema.parse(req.body);
      const settings = await storage.updateSiteSettings(data);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid settings data", details: error.errors });
      }
      console.error("Error updating site settings:", error);
      res.status(500).json({ error: "Failed to update site settings" });
    }
  });

  // Article Categories (public read, admin write)
  app.get("/api/article-categories", async (req, res) => {
    try {
      const categories = await storage.getArticleCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching article categories:", error);
      res.status(500).json({ error: "Failed to fetch article categories" });
    }
  });

  app.post("/api/admin/article-categories", isAdmin, async (req, res) => {
    try {
      const { insertArticleCategorySchema } = await import("@shared/schema");
      const data = insertArticleCategorySchema.parse(req.body);
      const category = await storage.createArticleCategory(data);
      res.json(category);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A category with this name already exists" });
      }
      console.error("Error creating article category:", error);
      res.status(500).json({ error: "Failed to create article category" });
    }
  });

  app.put("/api/admin/article-categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, icon } = req.body;
      console.log(`[Category Update] Request to update category ${id} to name: "${name}"`);
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      
      // Get old category name before updating
      const categories = await storage.getArticleCategories();
      const oldCategory = categories.find(c => c.id === id);
      const oldName = oldCategory?.name;
      console.log(`[Category Update] Found old category: "${oldName}" (id: ${oldCategory?.id})`);
      
      const updates: { name: string; icon?: string } = { name: name.trim() };
      if (icon !== undefined) {
        updates.icon = icon ? icon.trim() : null;
      }
      const category = await storage.updateArticleCategory(id, updates);
      if (!category) {
        console.log(`[Category Update] Category ${id} not found`);
        return res.status(404).json({ error: "Category not found" });
      }
      console.log(`[Category Update] Category updated successfully to: "${category.name}"`);
      
      // If name changed, update all articles using the old category name
      if (oldName && oldName !== name.trim()) {
        console.log(`[Category Update] Name changed from "${oldName}" to "${name.trim()}", cascading to articles...`);
        await storage.updateArticlesByCategory(oldName, name.trim());
        console.log(`[Category Update] Article cascade completed`);
      } else {
        console.log(`[Category Update] Name unchanged, no cascade needed`);
      }
      
      res.json(category);
    } catch (error: any) {
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A category with this name already exists" });
      }
      console.error("Error updating article category:", error);
      res.status(500).json({ error: "Failed to update article category" });
    }
  });

  app.delete("/api/admin/article-categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteArticleCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting article category:", error);
      res.status(500).json({ error: "Failed to delete article category" });
    }
  });

  app.post("/api/admin/article-categories/reorder", isAdmin, async (req, res) => {
    try {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return res.status(400).json({ error: "Categories must be an array" });
      }
      for (const { id, orderIndex } of categories) {
        await storage.updateArticleCategory(id, { orderIndex });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering article categories:", error);
      res.status(500).json({ error: "Failed to reorder article categories" });
    }
  });

  // Admin endpoint to repair article categories that don't match any category in the table
  app.post("/api/admin/article-categories/repair", isAdmin, async (req, res) => {
    try {
      const { oldCategory, newCategory } = req.body;
      if (!oldCategory || !newCategory) {
        return res.status(400).json({ error: "Both oldCategory and newCategory are required" });
      }
      console.log(`[Category Repair] Repairing articles from "${oldCategory}" to "${newCategory}"`);
      await storage.updateArticlesByCategory(oldCategory, newCategory);
      res.json({ success: true, message: `Updated articles from "${oldCategory}" to "${newCategory}"` });
    } catch (error) {
      console.error("Error repairing article categories:", error);
      res.status(500).json({ error: "Failed to repair article categories" });
    }
  });

  // Event Categories (public read, admin write)
  app.get("/api/event-categories", async (req, res) => {
    try {
      const categories = await storage.getEventCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching event categories:", error);
      res.status(500).json({ error: "Failed to fetch event categories" });
    }
  });

  app.post("/api/admin/event-categories", isAdmin, async (req, res) => {
    try {
      const { insertEventCategorySchema } = await import("@shared/schema");
      const data = insertEventCategorySchema.parse(req.body);
      const category = await storage.createEventCategory(data);
      res.json(category);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A category with this name already exists" });
      }
      console.error("Error creating event category:", error);
      res.status(500).json({ error: "Failed to create event category" });
    }
  });

  app.put("/api/admin/event-categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, icon } = req.body;
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }
      const updates: { name: string; icon?: string } = { name: name.trim() };
      if (icon !== undefined) {
        updates.icon = icon ? icon.trim() : null;
      }
      const category = await storage.updateEventCategory(id, updates);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error: any) {
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A category with this name already exists" });
      }
      console.error("Error updating event category:", error);
      res.status(500).json({ error: "Failed to update event category" });
    }
  });

  app.delete("/api/admin/event-categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteEventCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event category:", error);
      res.status(500).json({ error: "Failed to delete event category" });
    }
  });

  app.post("/api/admin/event-categories/reorder", isAdmin, async (req, res) => {
    try {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return res.status(400).json({ error: "Categories must be an array" });
      }
      for (const { id, orderIndex } of categories) {
        await storage.updateEventCategory(id, { orderIndex });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering event categories:", error);
      res.status(500).json({ error: "Failed to reorder event categories" });
    }
  });

  // Review Categories (public read, admin write)
  app.get("/api/review-categories", async (req, res) => {
    try {
      const categories = await storage.getReviewCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching review categories:", error);
      res.status(500).json({ error: "Failed to fetch review categories" });
    }
  });

  app.post("/api/admin/review-categories", isAdmin, async (req, res) => {
    try {
      const { insertReviewCategorySchema } = await import("@shared/schema");
      const data = insertReviewCategorySchema.parse(req.body);
      const category = await storage.createReviewCategory(data);
      res.json(category);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid category data", details: error.errors });
      }
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A category with this name already exists" });
      }
      console.error("Error creating review category:", error);
      res.status(500).json({ error: "Failed to create review category" });
    }
  });

  app.put("/api/admin/review-categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, icon } = req.body;
      
      if (!name || typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: "Category name is required" });
      }

      // Get old category name for cascading updates
      const categories = await storage.getReviewCategories();
      const oldCategory = categories.find(c => c.id === id);
      const oldName = oldCategory?.name;

      const updates: { name: string; icon?: string } = { name: name.trim() };
      if (icon !== undefined) {
        updates.icon = icon ? icon.trim() : null;
      }
      const category = await storage.updateReviewCategory(id, updates);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Cascade update to reviews if name changed
      if (oldName && oldName !== name.trim()) {
        await storage.updateReviewsByCategory(oldName, name.trim());
      }

      res.json(category);
    } catch (error: any) {
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A category with this name already exists" });
      }
      console.error("Error updating review category:", error);
      res.status(500).json({ error: "Failed to update review category" });
    }
  });

  app.delete("/api/admin/review-categories/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteReviewCategory(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting review category:", error);
      res.status(500).json({ error: "Failed to delete review category" });
    }
  });

  app.post("/api/admin/review-categories/reorder", isAdmin, async (req, res) => {
    try {
      const { categories } = req.body;
      if (!Array.isArray(categories)) {
        return res.status(400).json({ error: "Categories must be an array" });
      }
      for (const { id, orderIndex } of categories) {
        await storage.updateReviewCategory(id, { orderIndex });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering review categories:", error);
      res.status(500).json({ error: "Failed to reorder review categories" });
    }
  });

  // Profile Field Definitions (Admin)
  app.get("/api/admin/profile-fields", isAdmin, async (req, res) => {
    try {
      const fields = await storage.getProfileFieldDefinitions();
      // Include options for select fields and selector values count for selector fields
      const fieldsWithOptions = await Promise.all(fields.map(async (field) => {
        if (field.fieldType === 'select') {
          const options = await storage.getProfileFieldOptions(field.id);
          return { ...field, options, selectorValuesCount: 0 };
        } else if (field.fieldType === 'selector') {
          const selectorValues = await storage.getProfileFieldSelectorValues(field.id);
          return { ...field, options: [], selectorValuesCount: selectorValues.length };
        }
        return { ...field, options: [], selectorValuesCount: 0 };
      }));
      res.json(fieldsWithOptions);
    } catch (error) {
      console.error("Error fetching profile fields:", error);
      res.status(500).json({ error: "Failed to fetch profile fields" });
    }
  });

  app.post("/api/admin/profile-fields", isAdmin, async (req, res) => {
    try {
      const { label, fieldType, description, isRequired, options } = req.body;
      if (!label || !fieldType) {
        return res.status(400).json({ error: "Label and field type are required" });
      }
      
      // Generate slug from label
      const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      
      const field = await storage.createProfileFieldDefinition({
        label,
        slug,
        fieldType,
        description: description || null,
        isRequired: isRequired || false
      });
      
      // If it's a select field, create the options
      if (fieldType === 'select' && options && Array.isArray(options)) {
        for (let i = 0; i < options.length; i++) {
          await storage.createProfileFieldOption({
            fieldId: field.id,
            label: options[i],
            value: options[i].toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            orderIndex: i
          });
        }
      }
      
      // Fetch the field with options
      const fieldOptions = fieldType === 'select' ? await storage.getProfileFieldOptions(field.id) : [];
      res.status(201).json({ ...field, options: fieldOptions });
    } catch (error: any) {
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A field with this name already exists" });
      }
      console.error("Error creating profile field:", error);
      res.status(500).json({ error: "Failed to create profile field" });
    }
  });

  const profileFieldUpdateHandler = async (req: any, res: any) => {
    try {
      const id = parseInt(req.params.id);
      const { label, description, isRequired, options, useOnPlayRequests, useOnTeeTimes, useOnPlayRequestOffers } = req.body;
      
      const updates: any = {};
      if (label) {
        updates.label = label;
        updates.slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
      }
      if (description !== undefined) updates.description = description;
      if (isRequired !== undefined) updates.isRequired = isRequired;
      if (useOnPlayRequests !== undefined) updates.useOnPlayRequests = useOnPlayRequests;
      if (useOnTeeTimes !== undefined) updates.useOnTeeTimes = useOnTeeTimes;
      if (useOnPlayRequestOffers !== undefined) updates.useOnPlayRequestOffers = useOnPlayRequestOffers;
      
      const field = await storage.updateProfileFieldDefinition(id, updates);
      if (!field) {
        return res.status(404).json({ error: "Profile field not found" });
      }
      
      // Update options if provided and field is select type
      if (field.fieldType === 'select' && options && Array.isArray(options)) {
        await storage.deleteProfileFieldOptionsByField(id);
        for (let i = 0; i < options.length; i++) {
          await storage.createProfileFieldOption({
            fieldId: id,
            label: options[i],
            value: options[i].toLowerCase().replace(/[^a-z0-9]+/g, '_'),
            orderIndex: i
          });
        }
      }
      
      const fieldOptions = field.fieldType === 'select' ? await storage.getProfileFieldOptions(id) : [];
      res.json({ ...field, options: fieldOptions });
    } catch (error: any) {
      if (error?.code === '23505') {
        return res.status(400).json({ error: "A field with this name already exists" });
      }
      console.error("Error updating profile field:", error);
      res.status(500).json({ error: "Failed to update profile field" });
    }
  };
  app.put("/api/admin/profile-fields/:id", isAdmin, profileFieldUpdateHandler);
  app.patch("/api/admin/profile-fields/:id", isAdmin, profileFieldUpdateHandler);

  app.delete("/api/admin/profile-fields/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProfileFieldDefinition(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile field:", error);
      res.status(500).json({ error: "Failed to delete profile field" });
    }
  });

  app.post("/api/admin/profile-fields/reorder", isAdmin, async (req, res) => {
    try {
      const { fieldIds } = req.body;
      if (!Array.isArray(fieldIds)) {
        return res.status(400).json({ error: "fieldIds must be an array" });
      }
      
      for (let i = 0; i < fieldIds.length; i++) {
        await storage.updateProfileFieldDefinition(fieldIds[i], { orderIndex: i });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering profile fields:", error);
      res.status(500).json({ error: "Failed to reorder profile fields" });
    }
  });

  // Admin endpoint to upload selector values (bulk insert from text/CSV)
  app.post("/api/admin/profile-fields/:id/selector-values", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { values } = req.body;
      
      if (!Array.isArray(values)) {
        return res.status(400).json({ error: "Values must be an array of strings" });
      }
      
      // Verify field exists and is selector type
      const field = await storage.getProfileFieldDefinitionById(id);
      if (!field) {
        return res.status(404).json({ error: "Profile field not found" });
      }
      if (field.fieldType !== 'selector') {
        return res.status(400).json({ error: "Field is not a selector type" });
      }
      
      // Filter empty values and trim
      const cleanValues = values
        .map((v: any) => String(v).trim())
        .filter((v: string) => v.length > 0);
      
      await storage.bulkInsertProfileFieldSelectorValues(id, cleanValues);
      res.json({ success: true, count: cleanValues.length });
    } catch (error) {
      console.error("Error uploading selector values:", error);
      res.status(500).json({ error: "Failed to upload selector values" });
    }
  });

  // Admin endpoint to get all selector values for a field
  app.get("/api/admin/profile-fields/:id/selector-values", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const values = await storage.getProfileFieldSelectorValues(id);
      res.json(values);
    } catch (error) {
      console.error("Error fetching selector values:", error);
      res.status(500).json({ error: "Failed to fetch selector values" });
    }
  });

  // Public endpoint to search selector values (for autocomplete)
  app.get("/api/profile-fields/:id/selector-values/search", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const query = String(req.query.q || '');
      const limit = Math.min(parseInt(String(req.query.limit)) || 20, 50);
      
      // Verify field exists and is selector type
      const field = await storage.getProfileFieldDefinitionById(id);
      if (!field || field.fieldType !== 'selector') {
        return res.status(404).json({ error: "Selector field not found" });
      }
      
      const values = await storage.searchProfileFieldSelectorValues(id, query, limit);
      res.json(values.map(v => v.value));
    } catch (error) {
      console.error("Error searching selector values:", error);
      res.status(500).json({ error: "Failed to search selector values" });
    }
  });

  // Public endpoint to get profile field definitions (for profile editing)
  app.get("/api/profile-fields", async (req, res) => {
    try {
      const fields = await storage.getProfileFieldDefinitions();
      const fieldsWithOptions = await Promise.all(fields.map(async (field) => {
        if (field.fieldType === 'select') {
          const options = await storage.getProfileFieldOptions(field.id);
          return { ...field, options };
        }
        return { ...field, options: [] };
      }));
      res.json(fieldsWithOptions);
    } catch (error) {
      console.error("Error fetching profile fields:", error);
      res.status(500).json({ error: "Failed to fetch profile fields" });
    }
  });

  // Public endpoint to get profile field definitions (for play requests)
  app.get("/api/profile-field-definitions", async (req, res) => {
    try {
      const fields = await storage.getProfileFieldDefinitions();
      res.json(fields);
    } catch (error) {
      console.error("Error fetching profile field definitions:", error);
      res.status(500).json({ error: "Failed to fetch profile field definitions" });
    }
  });

  // Public endpoint to get all profile field options (for play requests matching)
  app.get("/api/profile-field-options", async (req, res) => {
    try {
      const fields = await storage.getProfileFieldDefinitions();
      const allOptions: { id: number; fieldId: number; label: string; value: string }[] = [];
      
      for (const field of fields) {
        if (field.fieldType === 'select') {
          const options = await storage.getProfileFieldOptions(field.id);
          allOptions.push(...options.map(opt => ({
            id: opt.id,
            fieldId: field.id,
            label: opt.label,
            value: opt.value
          })));
        } else if (field.fieldType === 'selector') {
          const selectorValues = await storage.getProfileFieldSelectorValues(field.id);
          allOptions.push(...selectorValues.map(sv => ({
            id: sv.id,
            fieldId: field.id,
            label: sv.value,
            value: sv.value
          })));
        }
      }
      
      res.json(allOptions);
    } catch (error) {
      console.error("Error fetching profile field options:", error);
      res.status(500).json({ error: "Failed to fetch profile field options" });
    }
  });

  // User profile field values
  app.get("/api/profile/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const values = await storage.getUserProfileFieldValues(userId);
      res.json(values);
    } catch (error) {
      console.error("Error fetching user profile field values:", error);
      res.status(500).json({ error: "Failed to fetch profile field values" });
    }
  });

  app.put("/api/profile/custom-fields", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { fieldValues } = req.body; // { fieldId: value, ... }
      
      if (!fieldValues || typeof fieldValues !== 'object') {
        return res.status(400).json({ error: "Field values are required" });
      }
      
      const errors: string[] = [];
      const results = [];
      
      for (const [fieldIdStr, value] of Object.entries(fieldValues)) {
        const fieldId = parseInt(fieldIdStr);
        if (isNaN(fieldId)) {
          errors.push(`Invalid field ID: ${fieldIdStr}`);
          continue;
        }
        
        // Validate field exists
        const field = await storage.getProfileFieldDefinitionById(fieldId);
        if (!field) {
          errors.push(`Field not found: ${fieldId}`);
          continue;
        }
        
        if (value && typeof value === 'string' && value.trim()) {
          const trimmedValue = value.trim();
          
          // Validate max length
          if (trimmedValue.length > 200) {
            errors.push(`${field.label} exceeds maximum length`);
            continue;
          }
          
          // For select fields, validate the value
          if (field.fieldType === 'select') {
            const options = await storage.getProfileFieldOptions(fieldId);
            const validValues = options.map(o => o.value);
            if (!validValues.includes(trimmedValue)) {
              errors.push(`Invalid option for ${field.label}`);
              continue;
            }
          }
          
          const result = await storage.setUserProfileFieldValue(userId, fieldId, trimmedValue);
          results.push(result);
        } else {
          await storage.deleteUserProfileFieldValue(userId, fieldId);
        }
      }
      
      const values = await storage.getUserProfileFieldValues(userId);
      if (errors.length > 0) {
        return res.status(400).json({ error: errors.join(', '), values });
      }
      res.json(values);
    } catch (error) {
      console.error("Error updating user profile field values:", error);
      res.status(500).json({ error: "Failed to update profile field values" });
    }
  });

  app.put("/api/profile/custom-fields/:fieldId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const fieldId = parseInt(req.params.fieldId);
      const { value } = req.body;
      
      if (isNaN(fieldId)) {
        return res.status(400).json({ error: "Invalid field ID" });
      }
      
      // Validate field exists
      const field = await storage.getProfileFieldDefinitionById(fieldId);
      if (!field) {
        return res.status(404).json({ error: "Field not found" });
      }
      
      if (value && typeof value === 'string' && value.trim()) {
        const trimmedValue = value.trim();
        
        // Validate max length (200 chars for text fields)
        if (trimmedValue.length > 200) {
          return res.status(400).json({ error: "Value exceeds maximum length of 200 characters" });
        }
        
        // For select fields, validate the value is one of the allowed options
        if (field.fieldType === 'select') {
          const options = await storage.getProfileFieldOptions(fieldId);
          const validValues = options.map(o => o.value);
          if (!validValues.includes(trimmedValue)) {
            return res.status(400).json({ error: "Invalid option selected" });
          }
        }
        
        await storage.setUserProfileFieldValue(userId, fieldId, trimmedValue);
      } else {
        await storage.deleteUserProfileFieldValue(userId, fieldId);
      }
      
      const values = await storage.getUserProfileFieldValues(userId);
      res.json(values);
    } catch (error) {
      console.error("Error updating user profile field value:", error);
      res.status(500).json({ error: "Failed to update profile field value" });
    }
  });

  // Profile Pictures with Captions
  app.get("/api/profile/pictures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const pictures = await storage.getProfilePictures(userId);
      res.json(pictures);
    } catch (error) {
      console.error("Error fetching profile pictures:", error);
      res.status(500).json({ error: "Failed to fetch profile pictures" });
    }
  });

  app.post("/api/profile/pictures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { imageUrl, pictureUrl, caption } = req.body;
      const url = imageUrl || pictureUrl;
      
      if (!url) {
        return res.status(400).json({ error: "Image URL is required" });
      }
      
      const existingPics = await storage.getProfilePictures(userId);
      const orderIndex = existingPics.length;
      
      const picture = await storage.addProfilePicture({
        userId,
        imageUrl: url,
        caption: caption || null,
        orderIndex
      });
      
      res.status(201).json(picture);
    } catch (error) {
      console.error("Error adding profile picture:", error);
      res.status(500).json({ error: "Failed to add profile picture" });
    }
  });

  app.put("/api/profile/pictures/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const id = parseInt(req.params.id);
      const { caption } = req.body;
      
      // Verify ownership by fetching user's pictures
      const pictures = await storage.getProfilePictures(userId);
      const pic = pictures.find(p => p.id === id);
      if (!pic) {
        return res.status(404).json({ error: "Picture not found" });
      }
      
      const updated = await storage.updateProfilePicture(id, { caption });
      res.json(updated);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Failed to update profile picture" });
    }
  });

  app.delete("/api/profile/pictures/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const id = parseInt(req.params.id);
      
      // Verify ownership
      const pictures = await storage.getProfilePictures(userId);
      const pic = pictures.find(p => p.id === id);
      if (!pic) {
        return res.status(404).json({ error: "Picture not found" });
      }
      
      await storage.deleteProfilePicture(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      res.status(500).json({ error: "Failed to delete profile picture" });
    }
  });

  app.get("/api/insider-tips", async (req, res) => {
    try {
      const tips = await storage.getInsiderTips();
      res.json(tips);
    } catch (error) {
      console.error("Error fetching insider tips:", error);
      res.status(500).json({ error: "Failed to fetch insider tips" });
    }
  });

  app.post("/api/insider-tips", isAdmin, async (req, res) => {
    try {
      const data = insertInsiderTipSchema.parse(req.body);
      const tip = await storage.createInsiderTip(data);
      res.status(201).json(tip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tip data", details: error.errors });
      }
      console.error("Error creating insider tip:", error);
      res.status(500).json({ error: "Failed to create insider tip" });
    }
  });

  app.put("/api/insider-tips/:id", isAdmin, async (req, res) => {
    try {
      const data = insertInsiderTipSchema.partial().parse(req.body);
      const tip = await storage.updateInsiderTip(req.params.id, data);
      if (!tip) {
        return res.status(404).json({ error: "Insider tip not found" });
      }
      res.json(tip);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid tip data", details: error.errors });
      }
      console.error("Error updating insider tip:", error);
      res.status(500).json({ error: "Failed to update insider tip" });
    }
  });

  app.delete("/api/insider-tips/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteInsiderTip(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Insider tip not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting insider tip:", error);
      res.status(500).json({ error: "Failed to delete insider tip" });
    }
  });

  app.get("/api/articles/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByArticle(req.params.id);
      const commentsWithNames = await Promise.all(
        comments.map(async (comment) => {
          const user = await getDb().users.findFirst({ where: { id: comment.userId } });
          return {
            ...comment,
            authorName: user?.mumblesVibeName || "Anonymous Viber",
            authorProfileImageUrl: user?.profileImageUrl || null
          };
        })
      );
      res.json(commentsWithNames);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/articles/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const articleId = req.params.id;
      const user = await getDb().users.findFirst({ where: { id: userId } });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const parentCommentId = req.body.parentCommentId || null;
      if (parentCommentId) {
        const parentComment = await storage.getCommentById(parentCommentId);
        if (!parentComment) {
          return res.status(400).json({ error: "Parent comment not found" });
        }
        if (parentComment.articleId !== articleId) {
          return res.status(400).json({ error: "Parent comment belongs to a different article" });
        }
      }

      const data = insertCommentSchema.parse({
        articleId,
        userId,
        content: req.body.content,
        parentCommentId
      });
      const comment = await storage.createComment(data);
      res.status(201).json({
        ...comment,
        authorName: user.mumblesVibeName,
        authorProfileImageUrl: user.profileImageUrl || null
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid comment", details: error.errors });
      }
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.patch("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const commentId = req.params.id;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }

      const existingComment = await storage.getCommentById(commentId);
      if (!existingComment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to edit this comment" });
      }

      const createdAt = existingComment.createdAt ? new Date(existingComment.createdAt).getTime() : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - createdAt > fiveMinutes) {
        return res.status(403).json({ error: "Edit window has expired (5 minutes)" });
      }

      const updatedComment = await storage.updateComment(commentId, userId, content.trim());
      if (!updatedComment) {
        return res.status(500).json({ error: "Failed to update comment" });
      }

      const user = await getDb().users.findFirst({ where: { id: userId } });
      res.json({
        ...updatedComment,
        authorName: user?.mumblesVibeName || "Anonymous Viber",
        authorProfileImageUrl: user?.profileImageUrl || null
      });
    } catch (error) {
      console.error("Error updating comment:", error);
      res.status(500).json({ error: "Failed to update comment" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const deleted = await storage.deleteComment(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found or not authorized" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.get("/api/articles/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getArticleLikes(req.params.id);
      const article = await storage.getArticleById(req.params.id);
      const boostedLikes = article?.boostedLikes || 0;
      res.json({ count: likes.length + boostedLikes });
    } catch (error) {
      console.error("Error fetching likes:", error);
      res.status(500).json({ error: "Failed to fetch likes" });
    }
  });

  app.get("/api/articles/:id/liked", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const liked = await storage.hasUserLikedArticle(req.params.id, userId);
      res.json({ liked });
    } catch (error) {
      console.error("Error checking like status:", error);
      res.status(500).json({ error: "Failed to check like status" });
    }
  });

  app.post("/api/articles/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isNowLiked = await storage.toggleArticleLike(req.params.id, userId);
      const likes = await storage.getArticleLikes(req.params.id);
      const article = await storage.getArticleById(req.params.id);
      const boostedLikes = article?.boostedLikes || 0;
      res.json({ liked: isNowLiked, count: likes.length + boostedLikes });
    } catch (error) {
      console.error("Error toggling like:", error);
      res.status(500).json({ error: "Failed to toggle like" });
    }
  });

  app.get("/api/podcasts/:id/likes", async (req, res) => {
    try {
      const likes = await storage.getPodcastLikes(req.params.id);
      res.json({ count: likes.length });
    } catch (error) {
      console.error("Error fetching podcast likes:", error);
      res.status(500).json({ error: "Failed to fetch podcast likes" });
    }
  });

  app.get("/api/podcasts/:id/liked", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const liked = await storage.hasUserLikedPodcast(req.params.id, userId);
      res.json({ liked });
    } catch (error) {
      console.error("Error checking podcast like status:", error);
      res.status(500).json({ error: "Failed to check podcast like status" });
    }
  });

  app.post("/api/podcasts/:id/like", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const isNowLiked = await storage.togglePodcastLike(req.params.id, userId);
      const likes = await storage.getPodcastLikes(req.params.id);
      res.json({ liked: isNowLiked, count: likes.length });
    } catch (error) {
      console.error("Error toggling podcast like:", error);
      res.status(500).json({ error: "Failed to toggle podcast like" });
    }
  });

  app.get("/api/podcasts/:id/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByPodcast(req.params.id);
      const commentsWithNames = await Promise.all(
        comments.map(async (comment) => {
          const user = await getDb().users.findFirst({ where: { id: comment.userId } });
          return {
            ...comment,
            authorName: user?.mumblesVibeName || "Anonymous Viber",
            authorProfileImageUrl: user?.profileImageUrl || null
          };
        })
      );
      res.json(commentsWithNames);
    } catch (error) {
      console.error("Error fetching podcast comments:", error);
      res.status(500).json({ error: "Failed to fetch podcast comments" });
    }
  });

  app.post("/api/podcasts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const podcastId = req.params.id;
      const user = await getDb().users.findFirst({ where: { id: userId } });
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const parentCommentId = req.body.parentCommentId || null;
      if (parentCommentId) {
        const parentComment = await storage.getPodcastCommentById(parentCommentId);
        if (!parentComment) {
          return res.status(400).json({ error: "Parent comment not found" });
        }
        if (parentComment.podcastId !== podcastId) {
          return res.status(400).json({ error: "Parent comment belongs to a different podcast" });
        }
      }

      const data = insertPodcastCommentSchema.parse({
        podcastId,
        userId,
        content: req.body.content,
        parentCommentId
      });
      const comment = await storage.createPodcastComment(data);
      res.status(201).json({
        ...comment,
        authorName: user.mumblesVibeName,
        authorProfileImageUrl: user.profileImageUrl || null
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid comment", details: error.errors });
      }
      console.error("Error creating podcast comment:", error);
      res.status(500).json({ error: "Failed to create podcast comment" });
    }
  });

  app.patch("/api/podcast-comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const commentId = req.params.id;
      const { content } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }

      const existingComment = await storage.getPodcastCommentById(commentId);
      if (!existingComment) {
        return res.status(404).json({ error: "Comment not found" });
      }

      if (existingComment.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to edit this comment" });
      }

      const createdAt = existingComment.createdAt ? new Date(existingComment.createdAt).getTime() : 0;
      const now = Date.now();
      const fiveMinutes = 5 * 60 * 1000;
      
      if (now - createdAt > fiveMinutes) {
        return res.status(403).json({ error: "Edit window has expired (5 minutes)" });
      }

      const updatedComment = await storage.updatePodcastComment(commentId, userId, content.trim());
      if (!updatedComment) {
        return res.status(500).json({ error: "Failed to update comment" });
      }

      const user = await getDb().users.findFirst({ where: { id: userId } });
      res.json({
        ...updatedComment,
        authorName: user?.mumblesVibeName || "Anonymous Viber",
        authorProfileImageUrl: user?.profileImageUrl || null
      });
    } catch (error) {
      console.error("Error updating podcast comment:", error);
      res.status(500).json({ error: "Failed to update podcast comment" });
    }
  });

  app.delete("/api/podcast-comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const deleted = await storage.deletePodcastComment(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found or not authorized" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting podcast comment:", error);
      res.status(500).json({ error: "Failed to delete podcast comment" });
    }
  });

  app.get("/api/vibes", async (req, res) => {
    try {
      const vibesList = await storage.getVibes();
      const vibesWithAuthors = await Promise.all(
        vibesList.map(async (vibe) => {
          const user = await getDb().users.findFirst({ where: { id: vibe.userId } });
          const reactions = await storage.getVibeReactions(vibe.id);
          const comments = await storage.getVibeComments(vibe.id);
          const commentsWithAuthors = await Promise.all(
            comments.map(async (comment) => {
              const commentUser = await getDb().users.findFirst({ where: { id: comment.userId } });
              return {
                ...comment,
                authorName: commentUser?.mumblesVibeName || "Anonymous Viber",
                authorProfileImageUrl: commentUser?.profileImageUrl || null
              };
            })
          );
          return {
            ...vibe,
            authorName: user?.mumblesVibeName || "Anonymous Viber",
            authorProfileImageUrl: user?.profileImageUrl || null,
            reactions,
            comments: commentsWithAuthors,
            commentCount: comments.length
          };
        })
      );
      res.json(vibesWithAuthors);
    } catch (error) {
      console.error("Error fetching vibes:", error);
      res.status(500).json({ error: "Failed to fetch vibes" });
    }
  });

  const createVibeBodySchema = insertVibeSchema.omit({ userId: true }).extend({
    content: z.string().min(1, "Content is required").max(1000, "Content too long").transform(s => s.trim()),
    category: z.enum(vibeCategories, { errorMap: () => ({ message: "Invalid category" }) }),
    vibeType: z.enum(vibeTypes).optional().default("post"),
    imageUrls: z.array(z.string().refine(
      (val) => val.startsWith('/objects/') || val.startsWith('http://') || val.startsWith('https://'),
      { message: "Invalid image path" }
    )).max(4).optional().default([])
  });

  app.post("/api/vibes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = createVibeBodySchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid content or category" });
      }

      const { content, category, imageUrls, vibeType } = parsed.data;
      const vibe = await storage.createVibe({ userId, content, category, imageUrls, vibeType });
      const user = await getDb().users.findFirst({ where: { id: userId } });
      
      res.status(201).json({
        ...vibe,
        authorName: user?.mumblesVibeName || "Anonymous Viber",
        authorProfileImageUrl: user?.profileImageUrl || null,
        reactions: [],
        comments: [],
        commentCount: 0
      });
    } catch (error) {
      console.error("Error creating vibe:", error);
      res.status(500).json({ error: "Failed to create vibe" });
    }
  });

  app.delete("/api/vibes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const deleted = await storage.deleteVibe(req.params.id, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Vibe not found or not authorized" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vibe:", error);
      res.status(500).json({ error: "Failed to delete vibe" });
    }
  });

  const EDIT_WINDOW_MINUTES = 5;

  app.patch("/api/vibes/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const vibeId = req.params.id;
      const { content, imageUrls } = req.body;

      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }

      const vibe = await storage.getVibeById(vibeId);
      if (!vibe) {
        return res.status(404).json({ error: "Vibe not found" });
      }

      if (vibe.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to edit this vibe" });
      }

      const createdAt = new Date(vibe.createdAt!);
      const now = new Date();
      const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

      if (diffMinutes > EDIT_WINDOW_MINUTES) {
        return res.status(403).json({ error: "Edit window has expired" });
      }

      const validImageUrls = imageUrls !== undefined && Array.isArray(imageUrls) ? imageUrls : undefined;
      const updatedVibe = await storage.updateVibe(vibeId, content.trim(), validImageUrls);
      res.json(updatedVibe);
    } catch (error) {
      console.error("Error editing vibe:", error);
      res.status(500).json({ error: "Failed to edit vibe" });
    }
  });

  const reactBodySchema = insertVibeReactionSchema.omit({ vibeId: true, userId: true }).extend({
    reactionType: z.enum(vibeReactionTypes, { errorMap: () => ({ message: "Invalid reaction type" }) })
  });

  app.post("/api/vibes/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const vibeId = req.params.id;
      const parsed = reactBodySchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid reaction type" });
      }

      const { reactionType } = parsed.data;
      const isNowReacted = await storage.toggleVibeReaction(vibeId, userId, reactionType);
      const reactions = await storage.getVibeReactions(vibeId);
      res.json({ reacted: isNowReacted, reactions });
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  const createVibeCommentBodySchema = insertVibeCommentSchema.omit({ vibeId: true, userId: true }).extend({
    content: z.string().min(1, "Comment is required").max(500, "Comment too long").transform(s => s.trim()),
    parentCommentId: z.string().optional().nullable()
  });

  app.post("/api/vibes/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const vibeId = req.params.id;
      const parsed = createVibeCommentBodySchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid comment" });
      }

      const { content, parentCommentId } = parsed.data;
      const comment = await storage.createVibeComment({ vibeId, userId, content, parentCommentId: parentCommentId || undefined });
      const user = await getDb().users.findFirst({ where: { id: userId } });
      
      res.status(201).json({
        ...comment,
        authorName: user?.mumblesVibeName || "Anonymous Viber",
        authorProfileImageUrl: user?.profileImageUrl || null,
        replies: []
      });
    } catch (error) {
      console.error("Error creating vibe comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/vibes/:vibeId/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const deleted = await storage.deleteVibeComment(req.params.commentId, userId);
      if (!deleted) {
        return res.status(404).json({ error: "Comment not found or not authorized" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vibe comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  app.post("/api/profile/image", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { objectPath } = req.body;
      
      if (!objectPath) {
        return res.status(400).json({ error: "No image path provided" });
      }

      const profileImageUrl = objectPath;
      
      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { profileImageUrl, updatedAt: new Date() }
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        profileImageUrl: updatedUser.profileImageUrl,
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ error: "Failed to upload profile image" });
    }
  });

  app.get("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const user = await getDb().users.findFirst({ where: { id: userId } });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        mumblesVibeName: user.mumblesVibeName,
        profileImageUrl: user.profileImageUrl,
        aboutMe: user.aboutMe,
        gender: user.gender,
        ageGroup: user.ageGroup,
        profilePictures: user.profilePictures || [],
        isProfilePublic: user.isProfilePublic ?? true,
        createdAt: user.createdAt,
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Get multiple user profiles by IDs (for team display)
  app.get("/api/users/profiles", async (req, res) => {
    try {
      const idsParam = req.query.ids as string;
      if (!idsParam) {
        return res.json([]);
      }
      
      const ids = idsParam.split(',').filter(Boolean);
      if (ids.length === 0) {
        return res.json([]);
      }
      
      const profiles = await getDb().users.findMany({
        where: { id: { in: ids } },
        select: { id: true, mumblesVibeName: true, profileImageUrl: true }
      });
      
      res.json(profiles);
    } catch (error) {
      console.error("Get user profiles error:", error);
      res.status(500).json({ error: "Failed to get profiles" });
    }
  });

  // Get public profile by user ID
  app.get("/api/users/:userId/profile", optionalAuth, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      const user = await getDb().users.findFirst({ where: { id: targetUserId } });
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if profile is private
      const isOwnProfile = req.userId === targetUserId;
      if (!user.isProfilePublic && !isOwnProfile) {
        return res.status(403).json({ error: "This profile is private", isPrivate: true });
      }

      // Get custom field values
      const fieldValues = await storage.getUserProfileFieldValues(targetUserId);
      const fieldDefinitions = await storage.getProfileFieldDefinitions();
      
      // Build custom fields with labels, sorted by orderIndex
      const customFieldsUnsorted = await Promise.all(fieldValues.map(async (val) => {
        const field = fieldDefinitions.find(f => f.id === val.fieldId);
        if (!field) return null;
        
        let displayValue = val.value;
        if (field.fieldType === 'select') {
          const options = await storage.getProfileFieldOptions(field.id);
          const option = options.find(o => o.value === val.value);
          displayValue = option?.label || val.value;
        }
        
        return {
          fieldId: val.fieldId,
          label: field.label,
          value: displayValue,
          fieldType: field.fieldType,
          orderIndex: field.orderIndex
        };
      }));
      
      const customFields = customFieldsUnsorted
        .filter((f): f is NonNullable<typeof f> => f !== null)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

      // Get profile pictures with captions
      const profilePictures = await storage.getProfilePictures(targetUserId);

      // Get user's group memberships (approved only)
      const userMemberships = await getDb().groupMemberships.findMany({
        where: { userId: targetUserId, status: "approved" }
      });
      
      // Get viewer's memberships to check which private groups they can see
      let viewerMembershipGroupIds: string[] = [];
      if (req.userId) {
        const viewerMemberships = await getDb().groupMemberships.findMany({
          where: { userId: req.userId, status: "approved" }
        });
        viewerMembershipGroupIds = viewerMemberships.map(m => m.groupId);
      }
      
      const userGroups = await Promise.all(
        userMemberships.map(async (membership) => {
          const group = await getDb().groups.findUnique({ where: { id: membership.groupId } });
          if (!group || !group.isActive) return null;
          // Show public groups to everyone, private groups only if viewer is also a member
          if (!group.isPublic && !viewerMembershipGroupIds.includes(group.id) && req.userId !== targetUserId) {
            return null;
          }
          return {
            id: group.id,
            name: group.name,
            slug: group.slug,
            imageUrl: group.imageUrl,
            role: membership.role,
            isPublic: group.isPublic
          };
        })
      );

      // Return public profile info (no email)
      res.json({
        id: user.id,
        mumblesVibeName: user.mumblesVibeName,
        profileImageUrl: user.profileImageUrl,
        aboutMe: user.aboutMe,
        gender: user.gender,
        ageGroup: user.ageGroup,
        profilePictures: profilePictures.length > 0 ? profilePictures : (user.profilePictures || []).map((url: string, i: number) => ({ id: i, imageUrl: url, caption: null })),
        customFields: customFields.filter(Boolean),
        isProfilePublic: user.isProfilePublic ?? true,
        createdAt: user.createdAt,
        groups: userGroups.filter(Boolean),
      });
    } catch (error) {
      console.error("Get public profile error:", error);
      res.status(500).json({ error: "Failed to get profile" });
    }
  });

  // Search users with filters
  const userSearchSchema = z.object({
    name: z.string().optional(),
    gender: z.string().optional(),
    ageGroup: z.string().optional(),
  }).passthrough();

  app.get("/api/users/search", isAuthenticated, async (req: any, res) => {
    try {
      const parsed = userSearchSchema.safeParse(req.query);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid search parameters" });
      }
      
      const { name, gender, ageGroup, ...customFieldFilters } = parsed.data;
      
      // Get all users with public profiles (excluding blocked and current user)
      const allUsers = await getDb().users.findMany({
        where: { isProfilePublic: true }
      });
      
      // Filter by blocked status and exclude current user
      let filteredUsers = allUsers.filter(u => !u.blocked && u.id !== req.userId);
      
      // Filter by name (case-insensitive partial match)
      if (name && name.trim()) {
        const searchTerm = name.toLowerCase().trim();
        filteredUsers = filteredUsers.filter(u => 
          u.mumblesVibeName.toLowerCase().includes(searchTerm)
        );
      }
      
      // Filter by gender
      if (gender && gender.trim()) {
        filteredUsers = filteredUsers.filter(u => u.gender === gender);
      }
      
      // Filter by ageGroup
      if (ageGroup && ageGroup.trim()) {
        filteredUsers = filteredUsers.filter(u => u.ageGroup === ageGroup);
      }
      
      // Handle custom field filters (format: field_<fieldId>=value)
      const customFieldFilterEntries = Object.entries(customFieldFilters)
        .filter(([key, value]) => key.startsWith('field_') && typeof value === 'string' && value);
      
      if (customFieldFilterEntries.length > 0 && filteredUsers.length > 0) {
        // Get all user field values in a single query (fix N+1)
        const userIds = filteredUsers.map(u => u.id);
        const allFieldValues = await getDb().userProfileFieldValues.findMany({
          where: { userId: { in: userIds } }
        });
        
        // Group by userId
        const userFieldMap = new Map<string, typeof allFieldValues>();
        allFieldValues.forEach(fv => {
          const existing = userFieldMap.get(fv.userId) || [];
          existing.push(fv);
          userFieldMap.set(fv.userId, existing);
        });
        
        filteredUsers = filteredUsers.filter(u => {
          const userValues = userFieldMap.get(u.id) || [];
          return customFieldFilterEntries.every(([key, filterValue]) => {
            const fieldId = parseInt(key.replace('field_', ''));
            const userFieldValue = userValues.find(v => v.fieldId === fieldId);
            return userFieldValue && userFieldValue.value === filterValue;
          });
        });
      }
      
      // Limit results to prevent large responses
      const limitedResults = filteredUsers.slice(0, 50);
      
      // Get connection status for each result
      const userIds = limitedResults.map(u => u.id);
      const allConnections = await getDb().userConnections.findMany({
        where: { OR: [{ requesterId: req.userId }, { receiverId: req.userId }] }
      });
      
      // Return users without sensitive data, with connection status
      const results = limitedResults.map(u => {
        const connection = allConnections.find(c => 
          (c.requesterId === req.userId && c.receiverId === u.id) ||
          (c.receiverId === req.userId && c.requesterId === u.id)
        );
        
        let connectionStatus: string = "none";
        if (connection) {
          if (connection.status === "accepted") {
            connectionStatus = "connected";
          } else if (connection.status === "pending") {
            connectionStatus = connection.requesterId === req.userId ? "pending_sent" : "pending_received";
          }
        }
        
        return {
          id: u.id,
          mumblesVibeName: u.mumblesVibeName,
          profileImageUrl: u.profileImageUrl,
          gender: u.gender,
          ageGroup: u.ageGroup,
          aboutMe: u.aboutMe,
          connectionStatus
        };
      });
      
      res.json(results);
    } catch (error) {
      console.error("Search users error:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });

  // User Connections API
  app.get("/api/connections", isAuthenticated, async (req: any, res) => {
    try {
      const connections = await storage.getConnections(req.userId);
      
      // Enrich with user data
      const enrichedConnections = await Promise.all(connections.map(async (conn) => {
        const otherUserId = conn.requesterId === req.userId ? conn.receiverId : conn.requesterId;
        const otherUser = await getDb().users.findFirst({ where: { id: otherUserId } });
        return {
          ...conn,
          connectedUser: otherUser ? {
            id: otherUser.id,
            mumblesVibeName: otherUser.mumblesVibeName,
            profileImageUrl: otherUser.profileImageUrl,
            gender: otherUser.gender,
            ageGroup: otherUser.ageGroup,
            aboutMe: otherUser.aboutMe
          } : null
        };
      }));
      
      res.json(enrichedConnections.filter(c => c.connectedUser));
    } catch (error) {
      console.error("Get connections error:", error);
      res.status(500).json({ error: "Failed to get connections" });
    }
  });

  app.get("/api/connections/requests/incoming", isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getIncomingRequests(req.userId);
      
      // Enrich with requester data
      const enrichedRequests = await Promise.all(requests.map(async (req_item) => {
        const requester = await getDb().users.findFirst({ where: { id: req_item.requesterId } });
        return {
          ...req_item,
          requester: requester ? {
            id: requester.id,
            mumblesVibeName: requester.mumblesVibeName,
            profileImageUrl: requester.profileImageUrl,
            gender: requester.gender,
            ageGroup: requester.ageGroup,
            aboutMe: requester.aboutMe
          } : null
        };
      }));
      
      res.json(enrichedRequests.filter(r => r.requester));
    } catch (error) {
      console.error("Get incoming requests error:", error);
      res.status(500).json({ error: "Failed to get incoming requests" });
    }
  });

  app.get("/api/connections/requests/outgoing", isAuthenticated, async (req: any, res) => {
    try {
      const requests = await storage.getOutgoingRequests(req.userId);
      
      // Enrich with receiver data
      const enrichedRequests = await Promise.all(requests.map(async (req_item) => {
        const receiver = await getDb().users.findFirst({ where: { id: req_item.receiverId } });
        return {
          ...req_item,
          receiver: receiver ? {
            id: receiver.id,
            mumblesVibeName: receiver.mumblesVibeName,
            profileImageUrl: receiver.profileImageUrl,
            gender: receiver.gender,
            ageGroup: receiver.ageGroup,
            aboutMe: receiver.aboutMe
          } : null
        };
      }));
      
      res.json(enrichedRequests.filter(r => r.receiver));
    } catch (error) {
      console.error("Get outgoing requests error:", error);
      res.status(500).json({ error: "Failed to get outgoing requests" });
    }
  });

  app.get("/api/connections/status/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const targetUserId = req.params.userId;
      if (targetUserId === req.userId) {
        return res.json({ status: "self" });
      }
      
      const connection = await storage.getConnectionBetweenUsers(req.userId, targetUserId);
      if (!connection) {
        return res.json({ status: "none" });
      }
      
      if (connection.status === "accepted") {
        return res.json({ status: "connected", connectionId: connection.id });
      }
      
      if (connection.status === "pending") {
        if (connection.requesterId === req.userId) {
          return res.json({ status: "pending_sent", connectionId: connection.id });
        } else {
          return res.json({ status: "pending_received", connectionId: connection.id });
        }
      }
      
      res.json({ status: "none" });
    } catch (error) {
      console.error("Get connection status error:", error);
      res.status(500).json({ error: "Failed to get connection status" });
    }
  });

  app.post("/api/connections/request", isAuthenticated, async (req: any, res) => {
    try {
      const { receiverId, message } = req.body;
      
      if (!receiverId || receiverId === req.userId) {
        return res.status(400).json({ error: "Cannot send a request to yourself" });
      }
      
      // Check if receiver exists in the same tenant
      const receiver = await getDb().users.findFirst({ where: { id: receiverId } });
      if (!receiver) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Check if connection already exists
      const existing = await storage.getConnectionBetweenUsers(req.userId, receiverId);
      if (existing) {
        if (existing.status === "accepted") {
          return res.status(409).json({ error: "You are already connected with this user" });
        } else if (existing.status === "pending") {
          // Check if current user is the requester or receiver
          if (existing.requesterId === req.userId) {
            return res.status(409).json({ error: "You already have a pending request to this user" });
          } else {
            return res.status(409).json({ error: "This user has already sent you a request. Check your notifications." });
          }
        } else if (existing.status === "rejected") {
          // Allow re-requesting after rejection by deleting old and creating new
          await storage.deleteConnection(existing.id);
        }
      }
      
      const connection = await storage.createConnectionRequest(req.userId, receiverId, message);
      
      // Create notification for receiver about incoming request
      await storage.createConnectionNotification({ userId: receiverId, type: "incoming_request", connectionId: connection.id, fromUserId: req.userId });
      res.status(201).json(connection);
    } catch (error) {
      console.error("Create connection request error:", error);
      res.status(500).json({ error: "Failed to create connection request" });
    }
  });

  app.post("/api/connections/:id/accept", isAuthenticated, async (req: any, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnectionById(connectionId);
      
      if (!connection) {
        return res.status(404).json({ error: "Connection request not found" });
      }
      
      if (connection.receiverId !== req.userId) {
        return res.status(403).json({ error: "Not authorized to accept this request" });
      }
      
      if (connection.status !== "pending") {
        return res.status(400).json({ error: "Request is no longer pending" });
      }
      
      const updated = await storage.updateConnectionStatus(connectionId, "accepted");
      
      // Create notification for requester that their request was accepted
      await storage.createConnectionNotification({ userId: connection.requesterId, type: "request_accepted", connectionId: connection.id, fromUserId: req.userId });
      
      res.json(updated);
    } catch (error) {
      console.error("Accept connection error:", error);
      res.status(500).json({ error: "Failed to accept connection" });
    }
  });

  app.post("/api/connections/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnectionById(connectionId);
      
      if (!connection) {
        return res.status(404).json({ error: "Connection request not found" });
      }
      
      if (connection.receiverId !== req.userId) {
        return res.status(403).json({ error: "Not authorized to reject this request" });
      }
      
      // Create notification for requester that their request was declined
      await storage.createConnectionNotification({ userId: connection.requesterId, type: "request_declined", connectionId: connection.id, fromUserId: req.userId });
      
      // Delete the connection to allow future requests
      await storage.deleteConnection(connectionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Reject connection error:", error);
      res.status(500).json({ error: "Failed to reject connection" });
    }
  });

  app.delete("/api/connections/:id", isAuthenticated, async (req: any, res) => {
    try {
      const connectionId = parseInt(req.params.id);
      const connection = await storage.getConnectionById(connectionId);
      
      if (!connection) {
        return res.status(404).json({ error: "Connection not found" });
      }
      
      // Allow either party to delete/cancel
      if (connection.requesterId !== req.userId && connection.receiverId !== req.userId) {
        return res.status(403).json({ error: "Not authorized to delete this connection" });
      }
      
      await storage.deleteConnection(connectionId);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete connection error:", error);
      res.status(500).json({ error: "Failed to delete connection" });
    }
  });

  // === Notifications ===
  
  // Get all notification counts (connection requests + messages)
  app.get("/api/notifications/counts", isAuthenticated, async (req: any, res) => {
    try {
      const counts = await storage.getUnreadConnectionNotificationCounts(req.userId);
      
      res.json({
        incomingRequests: counts.incomingRequests,
        acceptedRequests: counts.acceptedRequests,
        declinedRequests: counts.declinedRequests,
        newMessages: counts.newMessages,
        total: counts.total
      });
    } catch (error) {
      console.error("Get notification counts error:", error);
      res.status(500).json({ error: "Failed to get notification counts" });
    }
  });

  // Get all notifications with user info
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const notifications = await storage.getConnectionNotifications(req.userId);
      
      // Get unique user IDs from notifications (batch load to avoid N+1)
      const fromUserIds = Array.from(new Set(notifications.map(n => n.fromUserId).filter((id): id is string => id !== null)));
      
      // Batch fetch all users at once
      const usersData = fromUserIds.length > 0 
        ? await getDb().users.findMany({
            where: { id: { in: fromUserIds } },
            select: { id: true, mumblesVibeName: true, profileImageUrl: true }
          })
        : [];
      
      // Create lookup map
      const userMap = new Map(usersData.map(u => [u.id, u]));
      
      // Enrich notifications with user info
      const enrichedNotifications = notifications.map(n => ({
        ...n,
        fromUser: n.fromUserId ? userMap.get(n.fromUserId) || null : null
      }));
      
      res.json(enrichedNotifications);
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to get notifications" });
    }
  });

  // Get unread message counts per user
  app.get("/api/notifications/messages", isAuthenticated, async (req: any, res) => {
    try {
      const messageCounts = await storage.getUnreadMessageCountByUser(req.userId);
      res.json(messageCounts);
    } catch (error) {
      console.error("Get message counts error:", error);
      res.status(500).json({ error: "Failed to get message counts" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read-all", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markConnectionNotificationsAsRead(req.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark all notifications read error:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // Mark single notification as read
  app.post("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notification read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // Mark connection notifications as read
  app.post("/api/notifications/connections/read", isAuthenticated, async (req: any, res) => {
    try {
      const { type } = req.body; // optional: "incoming_request" or "request_accepted"
      await storage.markConnectionNotificationsAsRead(req.userId, type);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark notifications read error:", error);
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // === Direct Messages ===
  
  // Get conversation with a user
  app.get("/api/messages/:userId", isAuthenticated, async (req: any, res) => {
    try {
      const otherUserId = req.params.userId;
      const currentUserId = req.userId;
      const context = req.query.context as string | undefined;
      
      // Allow chat without connection for Play-related contexts (tee time offers and play requests)
      const isPlayContext = context === "tee_time_offer" || context === "play_request";
      
      if (!isPlayContext) {
        // Check if they are connected
        const connection = await storage.getConnectionBetweenUsers(currentUserId, otherUserId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ error: "You must be connected to chat with this user" });
        }
      }
      
      // Get messages between the two users
      const allMessages = await getDb().messages.findMany({
        where: {
          OR: [
            { senderId: currentUserId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: currentUserId }
          ]
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Mark messages from the other user as read
      await getDb().messages.updateMany({
        where: {
          senderId: otherUserId,
          receiverId: currentUserId,
          isRead: false
        },
        data: { isRead: true }
      });
      
      res.json(allMessages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to get messages" });
    }
  });

  // Send a message
  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    try {
      const { receiverId, content, context } = req.body;
      const senderId = req.userId;
      
      if (!receiverId || !content?.trim()) {
        return res.status(400).json({ error: "Receiver and message content are required" });
      }
      
      // Allow chat without connection for Play-related contexts (tee time offers and play requests)
      const isPlayContext = context === "tee_time_offer" || context === "play_request";
      
      if (!isPlayContext) {
        // Check if they are connected
        const connection = await storage.getConnectionBetweenUsers(senderId, receiverId);
        if (!connection || connection.status !== "accepted") {
          return res.status(403).json({ error: "You must be connected to send messages to this user" });
        }
      }
      
      const message = await getDb().messages.create({
        data: {
          senderId,
          receiverId,
          content: content.trim()
        }
      });
      
      // Create notification for receiver about new message
      await storage.createConnectionNotification({ userId: receiverId, type: "new_message", messageId: message.id, fromUserId: senderId });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get unread message count
  app.get("/api/messages/unread/count", isAuthenticated, async (req: any, res) => {
    try {
      const count = await getDb().messages.count({
        where: {
          receiverId: req.userId,
          isRead: false
        }
      });
      
      res.json({ count });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to get unread count" });
    }
  });

  // Get list of conversations (users you've chatted with)
  app.get("/api/conversations", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.userId;
      
      // Get all messages involving the current user
      const allMessages = await getDb().messages.findMany({
        where: {
          OR: [
            { senderId: currentUserId },
            { receiverId: currentUserId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // Group by conversation partner and get latest message
      const conversationsMap = new Map<string, any>();
      for (const msg of allMessages) {
        const partnerId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
        if (!conversationsMap.has(partnerId)) {
          const partner = await getDb().users.findFirst({ where: { id: partnerId } });
          const unreadCount = allMessages.filter(m => 
            m.senderId === partnerId && 
            m.receiverId === currentUserId && 
            !m.isRead
          ).length;
          
          conversationsMap.set(partnerId, {
            partnerId,
            partnerName: partner?.mumblesVibeName || "Unknown",
            partnerImage: partner?.profileImageUrl,
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount
          });
        }
      }
      
      res.json(Array.from(conversationsMap.values()));
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({ error: "Failed to get conversations" });
    }
  });

  app.patch("/api/profile", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const parsed = updateProfileSchema.safeParse(req.body);
      
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid profile data" });
      }

      const { mumblesVibeName, aboutMe, gender, ageGroup, isProfilePublic } = parsed.data;

      const updateData: any = { updatedAt: new Date() };
      if (mumblesVibeName !== undefined) updateData.mumblesVibeName = mumblesVibeName;
      if (aboutMe !== undefined) updateData.aboutMe = aboutMe;
      if (gender !== undefined) updateData.gender = gender;
      if (ageGroup !== undefined) updateData.ageGroup = ageGroup;
      if (isProfilePublic !== undefined) updateData.isProfilePublic = isProfilePublic;

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: updateData
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        mumblesVibeName: updatedUser.mumblesVibeName,
        profileImageUrl: updatedUser.profileImageUrl,
        aboutMe: updatedUser.aboutMe,
        gender: updatedUser.gender,
        ageGroup: updatedUser.ageGroup,
        profilePictures: updatedUser.profilePictures || [],
        isProfilePublic: updatedUser.isProfilePublic ?? true,
        createdAt: updatedUser.createdAt,
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // Upload profile pictures (gallery)
  app.post("/api/profile/pictures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { pictureUrl } = req.body;
      
      if (!pictureUrl) {
        return res.status(400).json({ error: "Picture URL is required" });
      }

      const user = await getDb().users.findFirst({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentPictures = (user.profilePictures as string[]) || [];
      if (currentPictures.length >= 10) {
        return res.status(400).json({ error: "Maximum 10 profile pictures allowed" });
      }

      const updatedPictures = [...currentPictures, pictureUrl];

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { profilePictures: updatedPictures as any, updatedAt: new Date() }
      });

      res.json({ profilePictures: updatedUser.profilePictures || [] });
    } catch (error) {
      console.error("Error adding profile picture:", error);
      res.status(500).json({ error: "Failed to add profile picture" });
    }
  });

  // Delete profile picture
  app.delete("/api/profile/pictures", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { pictureUrl } = req.body;
      
      if (!pictureUrl) {
        return res.status(400).json({ error: "Picture URL is required" });
      }

      const user = await getDb().users.findFirst({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const currentPictures = (user.profilePictures as string[]) || [];
      const updatedPictures = currentPictures.filter(url => url !== pictureUrl);

      const updatedUser = await prisma.users.update({
        where: { id: userId },
        data: { profilePictures: updatedPictures as any, updatedAt: new Date() }
      });

      res.json({ profilePictures: updatedUser.profilePictures || [] });
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      res.status(500).json({ error: "Failed to delete profile picture" });
    }
  });

  // Groups - Public routes
  app.get("/api/groups/my", isAuthenticated, async (req: any, res) => {
    try {
      const groups = await storage.getUserApprovedGroups(req.userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ error: "Failed to fetch user groups" });
    }
  });

  app.get("/api/groups/my-pending", isAuthenticated, async (req: any, res) => {
    try {
      const memberships = await storage.getGroupMembershipsByUser(req.userId);
      const pendingGroupIds = memberships
        .filter(m => m.status === "pending")
        .map(m => m.groupId);
      res.json(pendingGroupIds);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      res.status(500).json({ error: "Failed to fetch pending requests" });
    }
  });

  app.get("/api/groups/my-event-groups", isAuthenticated, async (req: any, res) => {
    try {
      const groups = await storage.getUserApprovedGroups(req.userId);
      const eventGroups: typeof groups = [];
      for (const group of groups.filter(g => g.eventId != null)) {
        if (group.eventId) {
          const event = await storage.getEventById(group.eventId);
          if (event && (event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition")) {
            const entry = await storage.getEventEntryByUserAndEvent(event.id, req.userId);
            if (!entry) {
              const allEntries = await storage.getEventEntries(event.id);
              const isAssigned = allEntries.some(e => e.assignedPlayerIds?.includes(req.userId));
              if (!isAssigned) continue;
            }
          }
        }
        eventGroups.push(group);
      }
      res.json(eventGroups);
    } catch (error) {
      console.error("Error fetching event groups:", error);
      res.status(500).json({ error: "Failed to fetch event groups" });
    }
  });

  app.get("/api/groups/my-competition-groups", isAuthenticated, async (req: any, res) => {
    try {
      const groups = await storage.getUserApprovedGroups(req.userId);
      const eventGroups = groups.filter(g => g.eventId != null);
      
      const competitionGroups: typeof eventGroups = [];
      for (const group of eventGroups) {
        if (group.eventId) {
          const event = await storage.getEventById(group.eventId);
          if (event && (event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition")) {
            const entry = await storage.getEventEntryByUserAndEvent(event.id, req.userId);
            if (entry) {
              competitionGroups.push(group);
            } else {
              const allEntries = await storage.getEventEntries(event.id);
              const isAssigned = allEntries.some(e => e.assignedPlayerIds?.includes(req.userId));
              if (isAssigned) competitionGroups.push(group);
            }
          }
        }
      }
      res.json(competitionGroups);
    } catch (error) {
      console.error("Error fetching competition groups:", error);
      res.status(500).json({ error: "Failed to fetch competition groups" });
    }
  });

  app.get("/api/groups", async (req, res) => {
    try {
      const groups = await storage.getActiveGroups();
      
      const groupsWithFlags: any[] = [];
      for (const group of groups) {
        let isCompetitionGroup = false;
        if (group.eventId) {
          const event = await storage.getEventById(group.eventId);
          if (event && (event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition")) {
            isCompetitionGroup = true;
          }
        }
        if (!isCompetitionGroup) {
          groupsWithFlags.push({ ...group, isCompetitionGroup });
        }
      }
      
      res.json(groupsWithFlags);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.get("/api/groups/:slug", optionalAuth, async (req: any, res) => {
    try {
      // Try to find by slug first, then by ID (UUID)
      let group = await storage.getGroupBySlug(req.params.slug);
      if (!group) {
        // Check if it's a UUID and try to find by ID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(req.params.slug)) {
          group = await storage.getGroupById(req.params.slug);
        }
      }
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      let isCompetitionGroup = false;
      let hasEventEntry = false;
      if (group.eventId) {
        const event = await storage.getEventById(group.eventId);
        if (event && (event.eventType === "knockout" || event.eventType === "team_competition" || event.eventType === "individual_competition")) {
          isCompetitionGroup = true;
        }
        if (event && (req as any).userId) {
          const userId = (req as any).userId;
          const entry = await storage.getEventEntryByUserAndEvent(event.id, userId);
          if (entry) {
            hasEventEntry = true;
          } else {
            const allEntries = await storage.getEventEntries(event.id);
            const isAssignedPlayer = allEntries.some(e => 
              e.assignedPlayerIds?.includes(userId)
            );
            if (isAssignedPlayer) hasEventEntry = true;
          }
        }
      }
      
      res.json({ ...group, isCompetitionGroup, hasEventEntry });
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ error: "Failed to fetch group" });
    }
  });

  // Get user's membership status for a group
  app.get("/api/groups/:id/membership", isAuthenticated, async (req: any, res) => {
    try {
      const membership = await storage.getGroupMembership(req.params.id, req.userId);
      res.json({ membership: membership || null });
    } catch (error) {
      console.error("Error fetching membership:", error);
      res.status(500).json({ error: "Failed to fetch membership" });
    }
  });

  // Request to join a group
  app.post("/api/groups/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const existing = await storage.getGroupMembership(req.params.id, req.userId);
      if (existing) {
        return res.status(400).json({ error: "Already requested or member" });
      }
      const membership = await storage.requestGroupMembership(req.params.id, req.userId);
      res.status(201).json(membership);
    } catch (error) {
      console.error("Error joining group:", error);
      res.status(500).json({ error: "Failed to join group" });
    }
  });

  // Leave a group
  app.delete("/api/groups/:id/leave", isAuthenticated, async (req: any, res) => {
    try {
      await storage.leaveGroup(req.params.id, req.userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving group:", error);
      res.status(500).json({ error: "Failed to leave group" });
    }
  });

  // Get user's joined groups
  app.get("/api/my-groups", isAuthenticated, async (req: any, res) => {
    try {
      const groups = await storage.getUserApprovedGroups(req.userId);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching user groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  // Get group members (for members only)
  app.get("/api/groups/:id/members", optionalAuth, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Only members can view the members list for private groups
      if (!group.isPublic) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const isMember = await storage.isGroupMember(req.params.id, req.userId);
        const isCreator = group.createdBy === req.userId;
        if (!isMember && !isCreator) {
          return res.status(403).json({ error: "You must be a member to view members" });
        }
      }
      
      const memberships = await storage.getGroupMemberships(req.params.id);
      const approvedMembers = memberships.filter(m => m.status === "approved");
      
      const membersWithUser = await Promise.all(approvedMembers.map(async (m) => {
        const user = await getDb().users.findFirst({ where: { id: m.userId } });
        return {
          id: m.id,
          userId: m.userId,
          joinedAt: m.approvedAt || m.requestedAt,
          name: user?.mumblesVibeName || "Unknown",
          profileImageUrl: user?.profileImageUrl,
          isCreator: m.userId === group.createdBy,
        };
      }));
      
      // Sort so creator is first
      membersWithUser.sort((a, b) => {
        if (a.isCreator) return -1;
        if (b.isCreator) return 1;
        return 0;
      });
      
      res.json(membersWithUser);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Get all members (including pending) for group creator
  app.get("/api/groups/:id/all-members", isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      const requestingUser = await storage.getUserById(req.userId);
      if (group.createdBy !== req.userId && !requestingUser?.isAdmin) {
        return res.status(403).json({ error: "Only the group creator or admins can manage members" });
      }
      
      const memberships = await storage.getGroupMemberships(req.params.id);
      const membershipsWithUser = await Promise.all(memberships.map(async (m) => {
        const user = await getDb().users.findFirst({ where: { id: m.userId } });
        return {
          ...m,
          userName: user?.mumblesVibeName || user?.email || "Unknown",
          userEmail: user?.email,
          profileImageUrl: user?.profileImageUrl
        };
      }));
      res.json(membershipsWithUser);
    } catch (error) {
      console.error("Error fetching all group members:", error);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  });

  // Group creator - approve membership
  app.patch("/api/groups/:groupId/members/:memberId/approve", isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      if (group.createdBy !== req.userId) {
        return res.status(403).json({ error: "Only the group creator can manage members" });
      }
      const membership = await storage.approveMembership(req.params.memberId, req.userId);
      
      // Send notification to the user that they've been approved
      if (membership && membership.userId) {
        await storage.createConnectionNotification({
          userId: membership.userId,
          type: "group_membership_approved",
          metadata: JSON.stringify({ groupId: group.id, groupName: group.name })
        });
      }
      
      res.json(membership);
    } catch (error) {
      console.error("Error approving membership:", error);
      res.status(500).json({ error: "Failed to approve membership" });
    }
  });

  // Group creator - reject membership
  app.patch("/api/groups/:groupId/members/:memberId/reject", isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      if (group.createdBy !== req.userId) {
        return res.status(403).json({ error: "Only the group creator can manage members" });
      }
      const membership = await storage.rejectMembership(req.params.memberId, req.userId);
      res.json(membership);
    } catch (error) {
      console.error("Error rejecting membership:", error);
      res.status(500).json({ error: "Failed to reject membership" });
    }
  });

  // Group creator - remove member
  app.delete("/api/groups/:groupId/members/:memberId", isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.groupId);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      const requestingUser = await storage.getUserById(req.userId);
      if (group.createdBy !== req.userId && !requestingUser?.isAdmin) {
        return res.status(403).json({ error: "Only the group creator or admins can manage members" });
      }
      await getDb().groupMemberships.delete({ where: { id: req.params.memberId } });
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing membership:", error);
      res.status(500).json({ error: "Failed to remove membership" });
    }
  });

  // Group Posts (public groups accessible to all, private groups members only)
  app.get("/api/groups/:id/posts", optionalAuth, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Public groups accessible to everyone, private groups require membership or creator
      if (!group.isPublic) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const isMember = await storage.isGroupMember(req.params.id, req.userId);
        const isCreator = group.createdBy === req.userId;
        if (!isMember && !isCreator) {
          return res.status(403).json({ error: "You must be a member to view posts" });
        }
      }
      
      const posts = await storage.getGroupPosts(req.params.id);
      const postsWithAuthor = await Promise.all(posts.map(async (post) => {
        const user = await getDb().users.findFirst({ where: { id: post.userId } });
        const reactions = await storage.getGroupPostReactions(post.id);
        const comments = await storage.getGroupPostComments(post.id);
        return {
          ...post,
          authorName: user?.mumblesVibeName || "Unknown",
          authorProfileImageUrl: user?.profileImageUrl,
          reactions,
          commentCount: comments.length
        };
      }));
      res.json(postsWithAuthor);
    } catch (error) {
      console.error("Error fetching group posts:", error);
      res.status(500).json({ error: "Failed to fetch posts" });
    }
  });

  app.post("/api/groups/:id/posts", isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      // Public groups allow any authenticated user to post, private groups require membership or creator
      if (!group.isPublic) {
        const isMember = await storage.isGroupMember(req.params.id, req.userId);
        const isCreator = group.createdBy === req.userId;
        if (!isMember && !isCreator) {
          return res.status(403).json({ error: "You must be a member to post" });
        }
      }
      
      const post = await storage.createGroupPost({
        groupId: req.params.id,
        userId: req.userId,
        content: req.body.content,
        category: req.body.category || "Social",
        postType: req.body.postType || "post",
        imageUrls: req.body.imageUrls || []
      });
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  app.delete("/api/group-posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteGroupPost(req.params.id, req.userId);
      if (!deleted) {
        return res.status(404).json({ error: "Post not found or not yours" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  // Group Events
  app.get("/api/groups/:id/events", optionalAuth, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      if (!group.isPublic) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const isMember = await storage.isGroupMember(req.params.id, req.userId);
        const isCreator = group.createdBy === req.userId;
        if (!isMember && !isCreator) {
          return res.status(403).json({ error: "You must be a member to view events" });
        }
      }
      
      const groupEvents = await storage.getGroupEvents(req.params.id);
      const eventsWithDetails = await Promise.all(groupEvents.map(async (event) => {
        const user = await getDb().users.findFirst({ where: { id: event.userId } });
        const reactions = await storage.getGroupEventReactions(event.id);
        const commentCount = await storage.getGroupEventCommentCount(event.id);
        return {
          ...event,
          authorName: user?.mumblesVibeName || "Unknown",
          authorProfileImageUrl: user?.profileImageUrl,
          reactions,
          commentCount
        };
      }));
      res.json(eventsWithDetails);
    } catch (error) {
      console.error("Error fetching group events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.post("/api/groups/:id/events", isAuthenticated, async (req: any, res) => {
    try {
      const group = await storage.getGroupById(req.params.id);
      if (!group) {
        return res.status(404).json({ error: "Group not found" });
      }
      
      if (!group.isPublic) {
        const isMember = await storage.isGroupMember(req.params.id, req.userId);
        const isCreator = group.createdBy === req.userId;
        if (!isMember && !isCreator) {
          return res.status(403).json({ error: "You must be a member to create events" });
        }
      }
      
      const groupEvent = await storage.createGroupEvent({
        groupId: req.params.id,
        userId: req.userId,
        name: req.body.name,
        startDate: req.body.startDate,
        endDate: req.body.endDate || null,
        venueName: req.body.venueName,
        address: req.body.address,
        summary: req.body.summary,
        description: req.body.description,
        imageUrl: req.body.imageUrl || null,
        tags: req.body.tags || [],
        ticketUrl: req.body.ticketUrl || null,
        showOnPublic: req.body.showOnPublic || false
      });
      
      if (req.body.showOnPublic) {
        await storage.createEventSuggestion({
          userId: req.userId,
          name: req.body.name,
          startDate: req.body.startDate,
          endDate: req.body.endDate || null,
          venueName: req.body.venueName,
          address: req.body.address,
          summary: req.body.summary,
          description: req.body.description,
          imageUrl: req.body.imageUrl || null,
          tags: req.body.tags || [],
          ticketUrl: req.body.ticketUrl || null,
          groupEventId: groupEvent.id
        });
      }
      
      res.status(201).json(groupEvent);
    } catch (error) {
      console.error("Error creating group event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  // Update group event (creator only)
  app.get("/api/admin/group-events", isAdmin, async (req: any, res) => {
    try {
      const allEvents = await storage.getAllGroupEvents();
      const eventsWithDetails = await Promise.all(allEvents.map(async (event) => {
        const user = await getDb().users.findFirst({ where: { id: event.userId } });
        const group = await storage.getGroupById(event.groupId);
        return {
          ...event,
          authorName: user?.mumblesVibeName || "Unknown",
          groupName: group?.name || "Unknown Group",
        };
      }));
      res.json(eventsWithDetails);
    } catch (error) {
      console.error("Error fetching all group events:", error);
      res.status(500).json({ error: "Failed to fetch group events" });
    }
  });

  app.put("/api/group-events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const event = await storage.getGroupEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const currentUser = await getDb().users.findFirst({ where: { id: req.userId } });
      const userIsAdmin = currentUser?.isAdmin === true;
      if (event.userId !== req.userId && !userIsAdmin) {
        return res.status(403).json({ error: "Only the event creator or an admin can edit this event" });
      }
      
      const wasPublic = event.showOnPublic;
      const nowPublic = req.body.showOnPublic || false;

      const updated = await storage.updateGroupEvent(req.params.id, {
        name: req.body.name,
        startDate: req.body.startDate,
        endDate: req.body.endDate || null,
        venueName: req.body.venueName,
        address: req.body.address,
        summary: req.body.summary,
        description: req.body.description,
        imageUrl: req.body.imageUrl || null,
        tags: req.body.tags || [],
        ticketUrl: req.body.ticketUrl || null,
        showOnPublic: nowPublic
      });

      if (!wasPublic && nowPublic) {
        const existing = await storage.getEventSuggestionByGroupEventId(req.params.id);
        if (!existing) {
          await storage.createEventSuggestion({
            userId: event.userId,
            name: req.body.name,
            startDate: req.body.startDate,
            endDate: req.body.endDate || null,
            venueName: req.body.venueName,
            address: req.body.address,
            summary: req.body.summary,
            description: req.body.description,
            imageUrl: req.body.imageUrl || null,
            tags: req.body.tags || [],
            ticketUrl: req.body.ticketUrl || null,
            groupEventId: req.params.id
          });
        }
      } else if (wasPublic && !nowPublic) {
        await storage.deleteEventSuggestionsByGroupEventId(req.params.id);
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating group event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/group-events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const event = await storage.getGroupEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      const currentUser = await getDb().users.findFirst({ where: { id: req.userId } });
      const userIsAdmin = currentUser?.isAdmin === true;
      if (event.userId !== req.userId && !userIsAdmin) {
        return res.status(403).json({ error: "Only the event creator or an admin can delete this event" });
      }
      
      await storage.deleteGroupEvent(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  // Get single group event with counts
  app.get("/api/group-events/:id", optionalAuth, async (req: any, res) => {
    try {
      const event = await storage.getGroupEventById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      const group = await storage.getGroupById(event.groupId);
      if (!group?.isPublic) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const isMember = await storage.isGroupMember(event.groupId, req.userId);
        if (!isMember) return res.status(403).json({ error: "Not a member" });
      }
      
      const author = await getDb().users.findFirst({ where: { id: event.userId } });
      const reactions = await storage.getGroupEventReactions(event.id);
      const commentCount = await storage.getGroupEventCommentCount(event.id);
      
      res.json({
        ...event,
        authorName: author?.mumblesVibeName || "Unknown",
        authorProfileImageUrl: author?.profileImageUrl,
        reactions,
        commentCount
      });
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  // Group Event Comments
  app.get("/api/group-events/:id/comments", optionalAuth, async (req: any, res) => {
    try {
      const event = await storage.getGroupEventById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      const group = await storage.getGroupById(event.groupId);
      if (!group?.isPublic) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const isMember = await storage.isGroupMember(event.groupId, req.userId);
        if (!isMember) return res.status(403).json({ error: "Not a member" });
      }
      
      const comments = await storage.getGroupEventComments(req.params.id);
      const commentsWithAuthor = await Promise.all(comments.map(async (c) => {
        const user = await getDb().users.findFirst({ where: { id: c.userId } });
        return {
          ...c,
          authorName: user?.mumblesVibeName || "Unknown",
          authorProfileImageUrl: user?.profileImageUrl
        };
      }));
      res.json(commentsWithAuthor);
    } catch (error) {
      console.error("Error fetching event comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/group-events/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const event = await storage.getGroupEventById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      const group = await storage.getGroupById(event.groupId);
      if (!group?.isPublic) {
        const isMember = await storage.isGroupMember(event.groupId, req.userId);
        if (!isMember) return res.status(403).json({ error: "Not a member" });
      }
      
      const comment = await storage.createGroupEventComment({
        eventId: req.params.id,
        userId: req.userId,
        content: req.body.content,
        parentCommentId: req.body.parentCommentId || null
      });
      
      const user = await getDb().users.findFirst({ where: { id: req.userId } });
      res.status(201).json({
        ...comment,
        authorName: user?.mumblesVibeName || "Unknown",
        authorProfileImageUrl: user?.profileImageUrl
      });
    } catch (error) {
      console.error("Error creating event comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/group-event-comments/:id", isAuthenticated, async (req: any, res) => {
    try {
      const deleted = await storage.deleteGroupEventComment(req.params.id, req.userId);
      if (!deleted) return res.status(403).json({ error: "Cannot delete this comment" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting event comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Group Event Reactions
  app.post("/api/group-events/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const event = await storage.getGroupEventById(req.params.id);
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      const group = await storage.getGroupById(event.groupId);
      if (!group?.isPublic) {
        const isMember = await storage.isGroupMember(event.groupId, req.userId);
        if (!isMember) return res.status(403).json({ error: "Not a member" });
      }
      
      const added = await storage.toggleGroupEventReaction(
        req.params.id,
        req.userId,
        req.body.reactionType || "like"
      );
      
      const reactions = await storage.getGroupEventReactions(req.params.id);
      res.json({ added, reactions });
    } catch (error) {
      console.error("Error toggling event reaction:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  // Group Post Comments
  app.get("/api/group-posts/:id/comments", optionalAuth, async (req: any, res) => {
    try {
      const post = await storage.getGroupPostById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      
      const group = await storage.getGroupById(post.groupId);
      if (!group?.isPublic) {
        if (!req.userId) {
          return res.status(401).json({ error: "Authentication required" });
        }
        const isMember = await storage.isGroupMember(post.groupId, req.userId);
        if (!isMember) return res.status(403).json({ error: "Not a member" });
      }
      
      const comments = await storage.getGroupPostComments(req.params.id);
      const commentsWithAuthor = await Promise.all(comments.map(async (c) => {
        const user = await getDb().users.findFirst({ where: { id: c.userId } });
        return {
          ...c,
          authorName: user?.mumblesVibeName || "Unknown",
          authorProfileImageUrl: user?.profileImageUrl
        };
      }));
      res.json(commentsWithAuthor);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/group-posts/:id/comments", isAuthenticated, async (req: any, res) => {
    try {
      const post = await storage.getGroupPostById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      
      const group = await storage.getGroupById(post.groupId);
      if (!group?.isPublic) {
        const isMember = await storage.isGroupMember(post.groupId, req.userId);
        if (!isMember) return res.status(403).json({ error: "Not a member" });
      }
      const comment = await storage.createGroupPostComment({
        postId: req.params.id,
        userId: req.userId,
        content: req.body.content,
        parentCommentId: req.body.parentCommentId || null
      });
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // Group Post Reactions
  app.post("/api/group-posts/:id/react", isAuthenticated, async (req: any, res) => {
    try {
      const post = await storage.getGroupPostById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      
      const group = await storage.getGroupById(post.groupId);
      if (!group?.isPublic) {
        const isMember = await storage.isGroupMember(post.groupId, req.userId);
        if (!isMember) return res.status(403).json({ error: "Not a member" });
      }
      
      const added = await storage.toggleGroupPostReaction(req.params.id, req.userId, req.body.reactionType);
      const reactions = await storage.getGroupPostReactions(req.params.id);
      res.json({ added, reactions });
    } catch (error) {
      console.error("Error toggling reaction:", error);
      res.status(500).json({ error: "Failed to toggle reaction" });
    }
  });

  // Edit Group Post
  app.patch("/api/group-posts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const post = await storage.getGroupPostById(req.params.id);
      if (!post) return res.status(404).json({ error: "Post not found" });
      if (post.userId !== req.userId) return res.status(403).json({ error: "Not your post" });
      if (post.edited) return res.status(403).json({ error: "Already edited once" });
      const EDIT_WINDOW_MINUTES = 5;
      const createdAt = new Date(post.createdAt!).getTime();
      const now = Date.now();
      const elapsed = (now - createdAt) / 1000;
      if (elapsed > EDIT_WINDOW_MINUTES * 60) {
        return res.status(403).json({ error: "Edit window expired" });
      }
      const updated = await storage.updateGroupPost(req.params.id, req.body.content, req.body.imageUrls);
      res.json(updated);
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  // Delete Group Post Comment
  app.delete("/api/group-posts/:postId/comments/:commentId", isAuthenticated, async (req: any, res) => {
    try {
      const post = await storage.getGroupPostById(req.params.postId);
      if (!post) return res.status(404).json({ error: "Post not found" });
      const isMember = await storage.isGroupMember(post.groupId, req.userId);
      if (!isMember) return res.status(403).json({ error: "Not a member" });
      const deleted = await storage.deleteGroupPostComment(req.params.commentId, req.userId);
      if (!deleted) return res.status(403).json({ error: "Could not delete comment" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // Admin Group Routes
  app.get("/api/admin/groups", isAdmin, async (req, res) => {
    try {
      const groups = await storage.getGroups();
      const groupsWithCreator = await Promise.all(
        groups.map(async (group) => {
          const creator = await storage.getUserById(group.createdBy);
          let linkedEventType: string | null = null;
          if (group.eventId) {
            const event = await storage.getEventById(group.eventId);
            linkedEventType = event?.eventType || null;
          }
          return {
            ...group,
            creatorName: creator?.mumblesVibeName || creator?.email || "Unknown",
            linkedEventType,
          };
        })
      );
      res.json(groupsWithCreator);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ error: "Failed to fetch groups" });
    }
  });

  app.get("/api/admin/groups/pending-counts", isAdmin, async (req, res) => {
    try {
      const groups = await storage.getGroups();
      const counts: Record<string, number> = {};
      for (const group of groups) {
        const pending = await storage.getPendingMemberships(group.id);
        if (pending.length > 0) {
          counts[group.id] = pending.length;
        }
      }
      res.json(counts);
    } catch (error) {
      console.error("Error fetching pending counts:", error);
      res.status(500).json({ error: "Failed to fetch pending counts" });
    }
  });

  app.get("/api/admin/groups/posts", isAdmin, async (req, res) => {
    try {
      const posts = await storage.getAllGroupPosts();
      const groups = await storage.getGroups();
      const groupMap = new Map(groups.map(g => [g.id, g]));
      
      const postsWithDetails = await Promise.all(posts.map(async (post) => {
        const user = await getDb().users.findFirst({ where: { id: post.userId } });
        const group = groupMap.get(post.groupId);
        return {
          ...post,
          authorName: user?.mumblesVibeName || user?.email || "Unknown",
          groupName: group?.name || "Unknown Group",
        };
      }));
      res.json(postsWithDetails);
    } catch (error) {
      console.error("Error fetching group posts:", error);
      res.status(500).json({ error: "Failed to fetch group posts" });
    }
  });

  app.delete("/api/admin/groups/posts/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.adminDeleteGroupPost(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Post not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group post:", error);
      res.status(500).json({ error: "Failed to delete post" });
    }
  });

  app.patch("/api/admin/groups/posts/:id", isAdmin, async (req, res) => {
    try {
      const updated = await storage.updateGroupPost(req.params.id, req.body.content, req.body.imageUrls);
      if (!updated) return res.status(404).json({ error: "Post not found" });
      res.json(updated);
    } catch (error) {
      console.error("Error updating group post:", error);
      res.status(500).json({ error: "Failed to update post" });
    }
  });

  app.post("/api/admin/groups", isAdmin, async (req: any, res) => {
    try {
      const group = await storage.createGroup({
        ...req.body,
        createdBy: req.userId
      });
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ error: "Failed to create group" });
    }
  });

  app.put("/api/admin/groups/:id", isAdmin, async (req, res) => {
    try {
      const group = await storage.updateGroup(req.params.id, req.body);
      if (!group) return res.status(404).json({ error: "Group not found" });
      res.json(group);
    } catch (error) {
      console.error("Error updating group:", error);
      res.status(500).json({ error: "Failed to update group" });
    }
  });

  app.delete("/api/admin/groups/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteGroup(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Group not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting group:", error);
      res.status(500).json({ error: "Failed to delete group" });
    }
  });

  // Admin - get pending memberships for a group
  app.get("/api/admin/groups/:id/pending", isAdmin, async (req, res) => {
    try {
      const memberships = await storage.getPendingMemberships(req.params.id);
      const membershipsWithUser = await Promise.all(memberships.map(async (m) => {
        const user = await getDb().users.findFirst({ where: { id: m.userId } });
        return {
          ...m,
          userName: user?.mumblesVibeName || user?.email || "Unknown",
          userEmail: user?.email
        };
      }));
      res.json(membershipsWithUser);
    } catch (error) {
      console.error("Error fetching pending memberships:", error);
      res.status(500).json({ error: "Failed to fetch memberships" });
    }
  });

  // Admin - approve membership
  app.patch("/api/admin/memberships/:id/approve", isAdmin, async (req: any, res) => {
    try {
      const membership = await storage.approveMembership(req.params.id, req.userId);
      if (!membership) return res.status(404).json({ error: "Membership not found" });
      
      // Send notification to the user that they've been approved
      if (membership.userId && membership.groupId) {
        const group = await storage.getGroupById(membership.groupId);
        if (group) {
          await storage.createConnectionNotification({
            userId: membership.userId,
            type: "group_membership_approved",
            metadata: JSON.stringify({ groupId: group.id, groupName: group.name })
          });
        }
      }
      
      res.json(membership);
    } catch (error) {
      console.error("Error approving membership:", error);
      res.status(500).json({ error: "Failed to approve membership" });
    }
  });

  // Admin - reject membership
  app.patch("/api/admin/memberships/:id/reject", isAdmin, async (req, res) => {
    try {
      const rejected = await storage.rejectMembership(req.params.id);
      if (!rejected) return res.status(404).json({ error: "Membership not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error rejecting membership:", error);
      res.status(500).json({ error: "Failed to reject membership" });
    }
  });

  // Admin - get all memberships for a group
  app.get("/api/admin/groups/:id/members", isAdmin, async (req, res) => {
    try {
      const memberships = await storage.getGroupMemberships(req.params.id);
      const membershipsWithUser = await Promise.all(memberships.map(async (m) => {
        const user = await getDb().users.findFirst({ where: { id: m.userId } });
        return {
          ...m,
          userName: user?.mumblesVibeName || user?.email || "Unknown",
          userEmail: user?.email,
          profileImageUrl: user?.profileImageUrl
        };
      }));
      res.json(membershipsWithUser);
    } catch (error) {
      console.error("Error fetching memberships:", error);
      res.status(500).json({ error: "Failed to fetch memberships" });
    }
  });

  // Admin - remove a member from a group
  app.delete("/api/admin/memberships/:id", isAdmin, async (req, res) => {
    try {
      await getDb().groupMemberships.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing membership:", error);
      res.status(500).json({ error: "Failed to remove membership" });
    }
  });

  // Play Requests
  app.get("/api/play-requests", isAuthenticated, async (req: any, res) => {
    try {
      const currentUserId = req.userId;
      const requests = await storage.getPlayRequests();
      
      // Get current user's profile field values for filtering
      const currentUserProfileValues = await storage.getUserProfileFieldValues(currentUserId);
      const userValueMap = new Map(currentUserProfileValues.map(v => [v.fieldId, v.value]));
      
      const enriched = await Promise.all(requests.map(async (request) => {
        const user = await getDb().users.findFirst({ where: { id: request.userId } });
        const criteria = await storage.getPlayRequestCriteria(request.id);
        const fields = await storage.getProfileFieldDefinitions();
        const enrichedCriteria = criteria.map(c => {
          const field = fields.find(f => f.id === c.fieldId);
          return { ...c, fieldLabel: field?.label || "Unknown" };
        });
        return {
          ...request,
          requesterProfile: user ? {
            userId: user.id,
            mumblesVibeName: user.mumblesVibeName,
            profileImageUrl: user.profileImageUrl
          } : null,
          criteria: enrichedCriteria
        };
      }));
      
      res.json(enriched);
    } catch (error) {
      console.error("Failed to fetch play requests:", error);
      res.status(500).json({ error: "Failed to fetch play requests" });
    }
  });

  app.get("/api/play-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const { id } = req.params;
      const request = await storage.getPlayRequestById(parseInt(id));
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      const user = await getDb().users.findFirst({ where: { id: request.userId } });
      const criteria = await storage.getPlayRequestCriteria(request.id);
      const fields = await storage.getProfileFieldDefinitions();
      const enrichedCriteria = criteria.map(c => {
        const field = fields.find(f => f.id === c.fieldId);
        return { ...c, fieldLabel: field?.label || "Unknown" };
      });
      res.json({
        ...request,
        requesterProfile: user ? {
          userId: user.id,
          mumblesVibeName: user.mumblesVibeName,
          profileImageUrl: user.profileImageUrl
        } : null,
        criteria: enrichedCriteria
      });
    } catch (error) {
      console.error("Failed to fetch play request:", error);
      res.status(500).json({ error: "Failed to fetch play request" });
    }
  });

  app.get("/api/my-play-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const requests = await storage.getPlayRequestsByUser(userId);
      res.json(requests);
    } catch (error) {
      console.error("Failed to fetch user play requests:", error);
      res.status(500).json({ error: "Failed to fetch play requests" });
    }
  });

  app.post("/api/play-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      const { guests, startDate, startTime, endDate, endTime, message, criteria } = req.body;
      
      // Validate required fields
      if (!startDate) {
        return res.status(400).json({ error: "Start date is required" });
      }
      
      if (guests && guests.length > 7) {
        return res.status(400).json({ error: "Maximum 7 guests allowed" });
      }
      
      if (message && message.length > 500) {
        return res.status(400).json({ error: "Message must be under 500 characters" });
      }

      // Ensure date strings are plain YYYY-MM-DD format (HTML date inputs may send unexpected formats)
      const normalizeDate = (d: string) => {
        const match = d.match(/(\d{4})-(\d{2})-(\d{2})/);
        return match ? `${match[1]}-${match[2]}-${match[3]}` : d;
      };
      
      const playRequest = await storage.createPlayRequest({
        userId,
        guests: guests || [],
        startDate: normalizeDate(startDate),
        startTime,
        endDate: endDate ? normalizeDate(endDate) : endDate,
        endTime,
        message,
        status: "active"
      });
      
      const criteriaArray = criteria || [];
      for (const crit of criteriaArray) {
        await storage.createPlayRequestCriteria({
          playRequestId: playRequest.id,
          fieldId: crit.fieldId,
          value: crit.value
        });
      }
      
      const matchingUsers = await storage.findMatchingUsersForPlayRequest(criteriaArray);
      const requesterProfile = await storage.getUserProfile(userId);
      const requesterName = requesterProfile?.mumblesVibeName || "A member";
      
      for (const matchUserId of matchingUsers) {
        if (matchUserId !== userId) {
          try {
            await storage.createConnectionNotification({
              userId: matchUserId,
              type: "play_request",
              fromUserId: userId,
              metadata: JSON.stringify({
                playRequestId: playRequest.id,
                requesterName,
                startDate,
                startTime,
                message: message?.substring(0, 100) || ""
              })
            });
          } catch (err) {
            console.error(`Failed to create notification for user ${matchUserId}:`, err);
          }
        }
      }
      
      res.status(201).json({
        ...playRequest,
        notifiedCount: matchingUsers.filter(id => id !== userId).length
      });
    } catch (error) {
      console.error("Failed to create play request:", error);
      res.status(500).json({ error: "Failed to create play request" });
    }
  });

  app.patch("/api/play-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const request = await storage.getPlayRequestById(parseInt(id));
      
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      
      if (request.userId !== userId) {
        return res.status(403).json({ error: "You can only edit your own play requests" });
      }

      const { startDate, startTime, endDate, endTime, message, guests, criteria } = req.body;
      
      const updated = await storage.updatePlayRequest(parseInt(id), {
        startDate,
        startTime,
        endDate: endDate || null,
        endTime: endTime || null,
        message: message || null,
        guests: guests || [],
      });
      
      // Update criteria if provided
      if (criteria && Array.isArray(criteria)) {
        await storage.deletePlayRequestCriteriaByRequest(parseInt(id));
        for (const crit of criteria) {
          await storage.createPlayRequestCriteria({
            playRequestId: parseInt(id),
            fieldId: crit.fieldId,
            value: crit.value,
          });
        }
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update play request:", error);
      res.status(500).json({ error: "Failed to update play request" });
    }
  });

  app.delete("/api/play-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const request = await storage.getPlayRequestById(parseInt(id));
      
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      
      if (request.userId !== userId) {
        return res.status(403).json({ error: "You can only delete your own play requests" });
      }
      
      await storage.deletePlayRequest(parseInt(id));
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete play request:", error);
      res.status(500).json({ error: "Failed to delete play request" });
    }
  });

  // Admin: Get all play requests
  app.get("/api/admin/play-requests", isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getPlayRequests();
      const enriched = await Promise.all(requests.map(async (request) => {
        const user = await storage.getUserById(request.userId);
        const criteria = await storage.getPlayRequestCriteria(request.id);
        return {
          ...request,
          requesterProfile: user ? {
            userId: user.id,
            mumblesVibeName: user.mumblesVibeName,
            profileImageUrl: user.profileImageUrl,
            email: user.email,
          } : null,
          criteria,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Failed to fetch admin play requests:", error);
      res.status(500).json({ error: "Failed to fetch play requests" });
    }
  });

  // Admin: Delete any play request
  app.delete("/api/admin/play-requests/:id", isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getPlayRequestById(id);
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      await storage.deletePlayRequestCriteriaByRequest(id);
      await storage.deletePlayRequest(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete play request:", error);
      res.status(500).json({ error: "Failed to delete play request" });
    }
  });

  // Admin: Get all tee time offers
  app.get("/api/admin/tee-time-offers", isAdmin, async (req: any, res) => {
    try {
      const offers = await storage.getTeeTimeOffers();
      const enriched = await Promise.all(offers.map(async (offer) => {
        const user = await storage.getUserById(offer.userId);
        const criteria = await storage.getTeeTimeOfferCriteria(offer.id);
        return {
          ...offer,
          creator: user ? {
            id: user.id,
            mumblesVibeName: user.mumblesVibeName,
            profileImageUrl: user.profileImageUrl,
            email: user.email,
          } : null,
          criteria,
        };
      }));
      res.json(enriched);
    } catch (error) {
      console.error("Failed to fetch admin tee time offers:", error);
      res.status(500).json({ error: "Failed to fetch tee time offers" });
    }
  });

  // Admin: Delete any tee time offer
  app.delete("/api/admin/tee-time-offers/:id", isAdmin, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const offer = await storage.getTeeTimeOfferById(id);
      if (!offer) {
        return res.status(404).json({ error: "Tee time offer not found" });
      }
      await storage.deleteTeeTimeOfferCriteriaByOffer(id);
      await storage.deleteTeeTimeOffer(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete tee time offer:", error);
      res.status(500).json({ error: "Failed to delete tee time offer" });
    }
  });

  // Play Request Offers
  app.get("/api/play-requests/:id/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const request = await storage.getPlayRequestById(parseInt(id));
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      
      // Only the request owner can view offers
      if (request.userId !== userId) {
        return res.status(403).json({ error: "You can only view offers on your own requests" });
      }
      
      const offers = await storage.getPlayRequestOffers(parseInt(id));
      const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        const offerUser = await getDb().users.findFirst({ where: { id: offer.userId } });
        const criteria = await storage.getPlayRequestOfferCriteria(offer.id);
        return {
          ...offer,
          offerUser: offerUser ? {
            id: offerUser.id,
            mumblesVibeName: offerUser.mumblesVibeName,
            profileImageUrl: offerUser.profileImageUrl
          } : null,
          criteria
        };
      }));
      
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Failed to fetch play request offers:", error);
      res.status(500).json({ error: "Failed to fetch offers" });
    }
  });

  app.post("/api/play-requests/:id/offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      const { note, clubName, criteria } = req.body;
      
      const request = await storage.getPlayRequestById(parseInt(id));
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      
      if (request.userId === userId) {
        return res.status(400).json({ error: "You cannot make an offer on your own request" });
      }
      
      // Check if user already made an offer on this request
      const existingOffer = await storage.getUserOfferForRequest(parseInt(id), userId);
      if (existingOffer) {
        return res.status(400).json({ error: "You have already made an offer on this request" });
      }
      
      const offer = await storage.createPlayRequestOffer({
        playRequestId: parseInt(id),
        userId,
        note: note || null,
        clubName: clubName || null
      });
      
      // Save offer criteria (custom profile field values)
      if (criteria && Array.isArray(criteria)) {
        for (const crit of criteria) {
          if (crit.fieldId && crit.fieldLabel && crit.value) {
            await storage.createPlayRequestOfferCriteria({
              playRequestOfferId: offer.id,
              fieldId: crit.fieldId,
              fieldLabel: crit.fieldLabel,
              value: crit.value
            });
          }
        }
      }
      
      // Get user info for notification
      const offerUser = await getDb().users.findFirst({ where: { id: userId } });
      const offerUserName = offerUser?.mumblesVibeName || "A member";
      
      // Send notification to the request owner
      await storage.createConnectionNotification({
        userId: request.userId,
        type: "play_request_offer",
        playRequestId: request.id,
        fromUserId: userId,
        metadata: JSON.stringify({
          offerId: offer.id,
          offerUserName,
          startDate: request.startDate,
          note: note?.substring(0, 100) || ""
        })
      });
      
      res.status(201).json(offer);
    } catch (error) {
      console.error("Failed to create play request offer:", error);
      res.status(500).json({ error: "Failed to create offer" });
    }
  });

  // Get user's offer for a specific play request
  app.get("/api/play-requests/:id/my-offer", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { id } = req.params;
      
      const offer = await storage.getUserOfferForRequest(parseInt(id), userId);
      res.json(offer);
    } catch (error) {
      console.error("Failed to get user offer:", error);
      res.status(500).json({ error: "Failed to get offer" });
    }
  });

  // Get all offers made by the current user
  app.get("/api/my-play-request-offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const offers = await storage.getOffersByUser(userId);
      res.json(offers);
    } catch (error) {
      console.error("Failed to get user offers:", error);
      res.status(500).json({ error: "Failed to get offers" });
    }
  });

  // Get offer counts for user's play requests
  app.get("/api/my-play-requests/offer-counts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const countsMap = await storage.getOfferCountsForUserRequests(userId);
      // Convert Map to object for JSON serialization
      const countsObj: Record<number, { pending: number; accepted: number; rejected: number }> = {};
      countsMap.forEach((value, key) => {
        countsObj[key] = value;
      });
      res.json(countsObj);
    } catch (error) {
      console.error("Failed to get offer counts:", error);
      res.status(500).json({ error: "Failed to get offer counts" });
    }
  });

  // Accept or decline an offer
  app.patch("/api/play-request-offers/:offerId/respond", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { offerId } = req.params;
      const { status, responseNote } = req.body;
      
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Status must be 'accepted' or 'rejected'" });
      }
      
      const offer = await storage.getPlayRequestOfferById(parseInt(offerId));
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      
      // Get the play request to verify ownership
      const request = await storage.getPlayRequestById(offer.playRequestId);
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      
      // Only the request owner can accept/decline offers
      if (request.userId !== userId) {
        return res.status(403).json({ error: "Only the request owner can respond to offers" });
      }
      
      // Update the offer status
      const updatedOffer = await storage.updateOfferStatus(parseInt(offerId), status, responseNote);
      
      // Get user info for notification
      const requestOwner = await getDb().users.findFirst({ where: { id: userId } });
      const requestOwnerName = requestOwner?.mumblesVibeName || "A member";
      
      // Send notification to the offer maker
      const notificationType = status === "accepted" ? "play_request_offer_accepted" : "play_request_offer_rejected";
      await storage.createConnectionNotification({
        userId: offer.userId,
        type: notificationType,
        playRequestId: request.id,
        fromUserId: userId,
        metadata: JSON.stringify({
          offerId: parseInt(offerId),
          requestOwnerName,
          startDate: request.startDate,
          responseNote: responseNote || ""
        })
      });
      
      res.json(updatedOffer);
    } catch (error) {
      console.error("Failed to respond to offer:", error);
      res.status(500).json({ error: "Failed to respond to offer" });
    }
  });

  // Get accepted games for user
  app.get("/api/my-games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const games = await storage.getAcceptedGamesForUser(userId);
      res.json(games);
    } catch (error) {
      console.error("Failed to get games:", error);
      res.status(500).json({ error: "Failed to get games" });
    }
  });

  // Withdraw (delete) an offer
  app.delete("/api/play-request-offers/:offerId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { offerId } = req.params;
      
      const offer = await storage.getPlayRequestOfferById(parseInt(offerId));
      if (!offer) {
        return res.status(404).json({ error: "Offer not found" });
      }
      
      // Only the offer creator can withdraw it
      if (offer.userId !== userId) {
        return res.status(403).json({ error: "You can only withdraw your own offers" });
      }
      
      // Get the play request to send notification to owner
      const request = await storage.getPlayRequestById(offer.playRequestId);
      if (!request) {
        return res.status(404).json({ error: "Play request not found" });
      }
      
      // Delete the offer
      await storage.deletePlayRequestOffer(parseInt(offerId));
      
      // Get user info for notification
      const withdrawUser = await getDb().users.findFirst({ where: { id: userId } });
      const withdrawUserName = withdrawUser?.mumblesVibeName || "A member";
      
      // Send notification to the request owner
      await storage.createConnectionNotification({
        userId: request.userId,
        type: "play_request_offer_withdrawn",
        playRequestId: request.id,
        fromUserId: userId,
        metadata: JSON.stringify({
          offerId: parseInt(offerId),
          withdrawUserName,
          startDate: request.startDate
        })
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to withdraw offer:", error);
      res.status(500).json({ error: "Failed to withdraw offer" });
    }
  });

  // Tee Time Offers
  app.get("/api/tee-time-offers", async (req, res) => {
    try {
      const offers = await storage.getTeeTimeOffers();
      
      // Enrich each offer with creator's profile info and calculate remaining spots
      const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        const creator = await getDb().users.findFirst({ where: { id: offer.userId } });
        const criteria = await storage.getTeeTimeOfferCriteria(offer.id);
        
        // Calculate accepted spots
        const reservations = await storage.getTeeTimeReservationsByOffer(offer.id);
        const acceptedSpots = reservations
          .filter(r => r.status === "accepted")
          .reduce((sum, r) => sum + r.spotsRequested, 0);
        const remainingSpots = Math.max(0, (offer.availableSpots || 0) - acceptedSpots);
        
        return {
          ...offer,
          availableSpots: remainingSpots,
          originalSpots: offer.availableSpots,
          creator: creator ? {
            id: creator.id,
            mumblesVibeName: creator.mumblesVibeName,
            profileImageUrl: creator.profileImageUrl
          } : null,
          criteria
        };
      }));
      
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Failed to get tee time offers:", error);
      res.status(500).json({ error: "Failed to get tee time offers" });
    }
  });

  app.get("/api/my-tee-time-offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const offers = await storage.getTeeTimeOffersByUser(userId);
      
      // Enrich with criteria and calculate remaining spots
      const enrichedOffers = await Promise.all(offers.map(async (offer) => {
        const criteria = await storage.getTeeTimeOfferCriteria(offer.id);
        
        // Calculate accepted spots and pending count
        const reservations = await storage.getTeeTimeReservationsByOffer(offer.id);
        const acceptedSpots = reservations
          .filter(r => r.status === "accepted")
          .reduce((sum, r) => sum + r.spotsRequested, 0);
        const remainingSpots = Math.max(0, (offer.availableSpots || 0) - acceptedSpots);
        const pendingCount = reservations.filter(r => r.status === "pending").length;
        
        return { 
          ...offer, 
          availableSpots: remainingSpots,
          originalSpots: offer.availableSpots,
          pendingReservations: pendingCount,
          criteria 
        };
      }));
      
      res.json(enrichedOffers);
    } catch (error) {
      console.error("Failed to get user's tee time offers:", error);
      res.status(500).json({ error: "Failed to get tee time offers" });
    }
  });

  app.post("/api/tee-time-offers", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const { criteria, ...offerData } = req.body;
      
      const validatedData = insertTeeTimeOfferSchema.parse({
        ...offerData,
        userId
      });
      
      const offer = await storage.createTeeTimeOffer(validatedData);
      
      // Create criteria entries
      if (criteria && Array.isArray(criteria)) {
        for (const crit of criteria) {
          await storage.createTeeTimeOfferCriteria({
            teeTimeOfferId: offer.id,
            fieldId: crit.fieldId,
            value: crit.value
          });
        }
      }
      
      res.json(offer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create tee time offer:", error);
      res.status(500).json({ error: "Failed to create tee time offer" });
    }
  });

  app.get("/api/tee-time-offers/:id", async (req, res) => {
    try {
      const offerId = parseInt(req.params.id);
      const offer = await storage.getTeeTimeOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Tee time offer not found" });
      }
      
      // Get creator from users table
      const creator = await storage.getUserById(offer.userId);
      const criteria = await storage.getTeeTimeOfferCriteria(offerId);
      
      // Calculate remaining spots after accepted reservations
      const reservations = await storage.getTeeTimeReservationsByOffer(offerId);
      const acceptedSpots = reservations
        .filter(r => r.status === "accepted")
        .reduce((sum, r) => sum + r.spotsRequested, 0);
      const remainingSpots = Math.max(0, (offer.availableSpots || 0) - acceptedSpots);
      
      res.json({
        ...offer,
        availableSpots: remainingSpots,
        originalSpots: offer.availableSpots,
        creator: creator ? {
          id: creator.id,
          mumblesVibeName: creator.mumblesVibeName,
          profileImageUrl: creator.profileImageUrl,
        } : null,
        criteria,
      });
    } catch (error) {
      console.error("Failed to get tee time offer:", error);
      res.status(500).json({ error: "Failed to get tee time offer" });
    }
  });

  app.patch("/api/tee-time-offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const offerId = parseInt(req.params.id);
      
      const offer = await storage.getTeeTimeOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Tee time offer not found" });
      }
      
      if (offer.userId !== userId) {
        return res.status(403).json({ error: "You can only edit your own tee time offers" });
      }
      
      // Validate with Zod schema
      const updateSchema = z.object({
        dateTime: z.string().optional(),
        homeClub: z.string().optional(),
        pricePerPerson: z.number().min(0).optional(),
        availableSpots: z.number().min(1).max(3).optional(),
        message: z.string().max(500).nullable().optional(),
        criteria: z.array(z.object({
          fieldId: z.number(),
          value: z.string(),
        })).optional(),
      });
      
      const validatedData = updateSchema.parse(req.body);
      const { dateTime, homeClub, pricePerPerson, availableSpots, message, criteria } = validatedData;
      
      const updated = await storage.updateTeeTimeOffer(offerId, {
        dateTime: dateTime ? new Date(dateTime) : undefined,
        homeClub,
        pricePerPerson,
        availableSpots,
        message,
      });
      
      // Update criteria if provided
      if (criteria && Array.isArray(criteria)) {
        await storage.deleteTeeTimeOfferCriteriaByOffer(offerId);
        for (const crit of criteria) {
          await storage.createTeeTimeOfferCriteria({
            teeTimeOfferId: offerId,
            fieldId: crit.fieldId,
            value: crit.value,
          });
        }
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update tee time offer:", error);
      res.status(500).json({ error: "Failed to update tee time offer" });
    }
  });

  app.delete("/api/tee-time-offers/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const offerId = parseInt(req.params.id);
      
      const offer = await storage.getTeeTimeOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Tee time offer not found" });
      }
      
      if (offer.userId !== userId) {
        return res.status(403).json({ error: "You can only delete your own tee time offers" });
      }
      
      await storage.deleteTeeTimeOffer(offerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete tee time offer:", error);
      res.status(500).json({ error: "Failed to delete tee time offer" });
    }
  });

  // Tee Time Reservations
  app.get("/api/tee-time-offers/:id/reservations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const offerId = parseInt(req.params.id);
      
      const offer = await storage.getTeeTimeOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Tee time offer not found" });
      }
      
      if (offer.userId !== userId) {
        return res.status(403).json({ error: "You can only view reservations for your own tee time offers" });
      }
      
      const reservations = await storage.getTeeTimeReservationsByOffer(offerId);
      
      const reservationsWithUsers = await Promise.all(
        reservations.map(async (reservation) => {
          const user = await storage.getUserById(reservation.userId);
          return {
            ...reservation,
            user: user ? {
              id: user.id,
              mumblesVibeName: user.mumblesVibeName,
              profileImageUrl: user.profileImageUrl
            } : null
          };
        })
      );
      
      res.json(reservationsWithUsers);
    } catch (error) {
      console.error("Failed to get tee time reservations:", error);
      res.status(500).json({ error: "Failed to get reservations" });
    }
  });

  app.post("/api/tee-time-offers/:id/reserve", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const offerId = parseInt(req.params.id);
      const { spotsRequested, guestNames } = req.body;
      
      const offer = await storage.getTeeTimeOfferById(offerId);
      if (!offer) {
        return res.status(404).json({ error: "Tee time offer not found" });
      }
      
      if (offer.userId === userId) {
        return res.status(400).json({ error: "You cannot reserve a spot on your own tee time offer" });
      }
      
      const spots = parseInt(spotsRequested) || 1;
      if (spots < 1 || spots > (offer.availableSpots || 1)) {
        return res.status(400).json({ error: "Invalid number of spots requested" });
      }
      
      // Validate guest names if more than 1 spot is requested
      const guestNamesList = spots > 1 ? (guestNames || []) : [];
      
      const reservation = await storage.createTeeTimeReservation({
        teeTimeOfferId: offerId,
        userId,
        spotsRequested: spots,
        guestNames: guestNamesList
      });
      
      await storage.createConnectionNotification({
        userId: offer.userId,
        type: "tee_time_reservation",
        fromUserId: userId,
        metadata: JSON.stringify({ teeTimeOfferId: offerId })
      });
      
      res.json(reservation);
    } catch (error) {
      console.error("Failed to create tee time reservation:", error);
      res.status(500).json({ error: "Failed to create reservation" });
    }
  });

  app.get("/api/tee-time-offers/:id/my-reservation", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const offerId = parseInt(req.params.id);
      
      const reservation = await storage.getUserReservationForOffer(userId, offerId);
      res.json(reservation || null);
    } catch (error) {
      console.error("Failed to get user reservation:", error);
      res.status(500).json({ error: "Failed to get reservation" });
    }
  });

  app.patch("/api/tee-time-reservations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const reservationId = parseInt(req.params.id);
      const { status, responseNote } = req.body;
      
      const reservation = await storage.getTeeTimeReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      
      const offer = await storage.getTeeTimeOfferById(reservation.teeTimeOfferId);
      if (!offer || offer.userId !== userId) {
        return res.status(403).json({ error: "You can only respond to reservations for your own tee time offers" });
      }
      
      if (!["accepted", "declined"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      // Check if there are enough spots available when accepting
      if (status === "accepted") {
        const allReservations = await storage.getTeeTimeReservationsByOffer(reservation.teeTimeOfferId);
        const acceptedSpots = allReservations
          .filter(r => r.status === "accepted")
          .reduce((sum, r) => sum + r.spotsRequested, 0);
        const remainingSpots = offer.availableSpots - acceptedSpots;
        
        if (reservation.spotsRequested > remainingSpots) {
          return res.status(400).json({ 
            error: `Cannot accept this request. Only ${remainingSpots} spot${remainingSpots !== 1 ? 's' : ''} remaining, but ${reservation.spotsRequested} requested.` 
          });
        }
      }
      
      const updated = await storage.updateTeeTimeReservation(reservationId, { status, responseNote });
      
      const notificationType = status === "accepted" ? "tee_time_accepted" : "tee_time_declined";
      await storage.createConnectionNotification({
        userId: reservation.userId,
        type: notificationType,
        fromUserId: userId,
        metadata: JSON.stringify({ teeTimeOfferId: reservation.teeTimeOfferId })
      });
      
      res.json(updated);
    } catch (error) {
      console.error("Failed to update tee time reservation:", error);
      res.status(500).json({ error: "Failed to update reservation" });
    }
  });

  app.delete("/api/tee-time-reservations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const reservationId = parseInt(req.params.id);
      
      const reservation = await storage.getTeeTimeReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      
      if (reservation.userId !== userId) {
        return res.status(403).json({ error: "You can only cancel your own reservations" });
      }
      
      if (reservation.status !== "pending") {
        return res.status(400).json({ error: "Only pending reservations can be cancelled" });
      }
      
      await storage.deleteTeeTimeReservation(reservationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to cancel tee time reservation:", error);
      res.status(500).json({ error: "Failed to cancel reservation" });
    }
  });

  app.get("/api/my-tee-time-reservations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      const reservations = await storage.getTeeTimeReservationsByUser(userId);
      
      // Enrich with offer and host details
      const enrichedReservations = await Promise.all(reservations.map(async (reservation) => {
        const offer = await storage.getTeeTimeOfferById(reservation.teeTimeOfferId);
        if (!offer) return { ...reservation, offer: null, host: null };
        
        const host = await storage.getUserById(offer.userId);
        return {
          ...reservation,
          offer: {
            id: offer.id,
            dateTime: offer.dateTime,
            homeClub: offer.homeClub,
            pricePerPerson: offer.pricePerPerson,
            message: offer.message
          },
          host: host ? {
            id: host.id,
            mumblesVibeName: host.mumblesVibeName,
            profileImageUrl: host.profileImageUrl
          } : null
        };
      }));
      
      res.json(enrichedReservations);
    } catch (error) {
      console.error("Failed to get user reservations:", error);
      res.status(500).json({ error: "Failed to get reservations" });
    }
  });

  // Get accepted reservations for tee times where the current user is the HOST
  app.get("/api/my-tee-time-accepted-guests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      
      // Get all tee time offers by this user
      const myOffers = await storage.getTeeTimeOffersByUser(userId);
      
      // Get all accepted reservations for these offers
      const acceptedGuests = [];
      for (const offer of myOffers) {
        const reservations = await storage.getTeeTimeReservationsByOffer(offer.id);
        const accepted = reservations.filter(r => r.status === "accepted");
        
        for (const reservation of accepted) {
          const guest = await storage.getUserById(reservation.userId);
          acceptedGuests.push({
            ...reservation,
            offer: {
              id: offer.id,
              dateTime: offer.dateTime,
              homeClub: offer.homeClub,
              pricePerPerson: offer.pricePerPerson,
              message: offer.message
            },
            guest: guest ? {
              id: guest.id,
              mumblesVibeName: guest.mumblesVibeName,
              profileImageUrl: guest.profileImageUrl
            } : null
          });
        }
      }
      
      res.json(acceptedGuests);
    } catch (error) {
      console.error("Failed to get accepted guests:", error);
      res.status(500).json({ error: "Failed to get accepted guests" });
    }
  });

  // Subscription Plans (Admin)
  app.get("/api/admin/subscription-plans", isAdmin, async (req, res) => {
    try {
      const plans = await storage.getSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Failed to get subscription plans:", error);
      res.status(500).json({ error: "Failed to get subscription plans" });
    }
  });

  app.post("/api/admin/subscription-plans", isAdmin, async (req, res) => {
    try {
      const validatedData = insertSubscriptionPlanSchema.parse(req.body);
      const plan = await storage.createSubscriptionPlan(validatedData);
      res.json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to create subscription plan:", error);
      res.status(500).json({ error: "Failed to create subscription plan" });
    }
  });

  app.patch("/api/admin/subscription-plans/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertSubscriptionPlanSchema.partial().parse(req.body);
      const plan = await storage.updateSubscriptionPlan(id, validatedData);
      if (!plan) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update subscription plan:", error);
      res.status(500).json({ error: "Failed to update subscription plan" });
    }
  });

  app.delete("/api/admin/subscription-plans/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteSubscriptionPlan(id);
      if (!deleted) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete subscription plan:", error);
      res.status(500).json({ error: "Failed to delete subscription plan" });
    }
  });

  app.post("/api/admin/subscription-plans/:id/set-default", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const plan = await storage.setDefaultSubscriptionPlan(id);
      if (!plan) {
        return res.status(404).json({ error: "Subscription plan not found" });
      }
      res.json(plan);
    } catch (error) {
      console.error("Failed to set default subscription plan:", error);
      res.status(500).json({ error: "Failed to set default subscription plan" });
    }
  });

  // Public endpoint for active subscription plans
  app.get("/api/subscription-plans", async (req, res) => {
    try {
      const plans = await storage.getActiveSubscriptionPlans();
      res.json(plans);
    } catch (error) {
      console.error("Failed to get subscription plans:", error);
      res.status(500).json({ error: "Failed to get subscription plans" });
    }
  });

  // Get user's current subscription
  app.get("/api/user/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let plan = null;
      if (user.subscriptionPlanId) {
        plan = await storage.getSubscriptionPlanById(parseInt(user.subscriptionPlanId));
      } else {
        // Get default plan if user has no subscription
        const plans = await storage.getActiveSubscriptionPlans();
        plan = plans.find(p => p.isDefault) || null;
      }

      res.json({ plan, subscriptionStartDate: user.subscriptionStartDate, subscriptionEndDate: user.subscriptionEndDate });
    } catch (error) {
      console.error("Failed to get user subscription:", error);
      res.status(500).json({ error: "Failed to get user subscription" });
    }
  });

  // Update user's subscription
  const updateSubscriptionSchema = z.object({
    planId: z.number().int().positive("Plan ID must be a positive integer")
  });

  app.post("/api/user/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const validatedData = updateSubscriptionSchema.parse(req.body);
      const { planId } = validatedData;

      const plan = await storage.getSubscriptionPlanById(planId);
      if (!plan || !plan.isActive) {
        return res.status(404).json({ error: "Subscription plan not found or inactive" });
      }

      // For now, just update the user's subscription (payment integration would go here)
      await storage.updateUserSubscription(userId, planId);
      
      res.json({ success: true, plan });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Validation failed", details: error.errors });
      }
      console.error("Failed to update user subscription:", error);
      res.status(500).json({ error: "Failed to update user subscription" });
    }
  });

  // Stripe subscription routes
  app.get("/api/stripe/config", async (req, res) => {
    try {
      const publishableKey = await getStripePublishableKey();
      res.json({ publishableKey });
    } catch (error) {
      console.error("Failed to get Stripe config:", error);
      res.status(500).json({ error: "Failed to get Stripe configuration" });
    }
  });

  app.get("/api/stripe/products", async (req, res) => {
    try {
      const rows = await stripeService.listProductsWithPricesFromApi();
      
      const productsMap = new Map();
      for (const row of rows as any[]) {
        if (!productsMap.has(row.product_id)) {
          productsMap.set(row.product_id, {
            id: row.product_id,
            name: row.product_name,
            description: row.product_description,
            active: row.product_active,
            metadata: row.product_metadata,
            prices: []
          });
        }
        if (row.price_id) {
          productsMap.get(row.product_id).prices.push({
            id: row.price_id,
            unit_amount: row.unit_amount,
            currency: row.currency,
            recurring: row.recurring,
            active: row.price_active,
            metadata: row.price_metadata,
          });
        }
      }

      res.json({ data: Array.from(productsMap.values()) });
    } catch (error) {
      console.error("Failed to get Stripe products:", error);
      res.status(500).json({ error: "Failed to get products" });
    }
  });

  app.post("/api/stripe/checkout", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripeService.createCustomer(user.email, user.id, user.mumblesVibeName);
        customerId = customer.id;
        await storage.updateUserStripeInfo(userId, { stripeCustomerId: customerId });
      }

      const baseUrl = getFrontendBaseUrl(req);
      const session = await stripeService.createCheckoutSession(
        customerId,
        priceId,
        `${baseUrl}/subscription?success=true`,
        `${baseUrl}/subscription?canceled=true`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Failed to create checkout session:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });


  app.post("/api/stripe/change-plan", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const user = await storage.getUserById(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found. Please subscribe first." });
      }

      const baseUrl = getFrontendBaseUrl(req);
      const result = await stripeService.createSubscriptionChangeSession(
        user.stripeCustomerId,
        priceId,
        `${baseUrl}/subscription?success=true`,
        `${baseUrl}/subscription?canceled=true`
      );

      if (result.type === 'update') {
        const subscription = result.subscription as any;
        const updatedPriceId = subscription.items?.data?.[0]?.price?.id;
        let matchedPlanId: string | undefined;
        if (updatedPriceId) {
          const allPlans = await storage.getActiveSubscriptionPlans();
          const matchedPlan = allPlans.find(p => p.stripePriceId === updatedPriceId);
          if (matchedPlan) {
            matchedPlanId = matchedPlan.id.toString();
          }
        }
        await storage.updateUserStripeInfo(userId, { 
          stripeSubscriptionId: subscription.id,
          subscriptionEndDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
          subscriptionPlanId: matchedPlanId,
        });
        res.json({ success: true, subscription: result.subscription });
      } else {
        res.json({ url: (result.session as any).url });
      }
    } catch (error) {
      console.error("Failed to change subscription plan:", error);
      res.status(500).json({ error: "Failed to change subscription plan" });
    }
  });

  app.post("/api/stripe/cancel", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserById(userId);
      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ error: "No active subscription found" });
      }

      const { cancelImmediately } = req.body;
      const subscription = await stripeService.cancelSubscription(
        user.stripeSubscriptionId, 
        !cancelImmediately
      );

      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.post("/api/stripe/reactivate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserById(userId);
      if (!user?.stripeSubscriptionId) {
        return res.status(400).json({ error: "No subscription found" });
      }

      const subscription = await stripeService.reactivateSubscription(user.stripeSubscriptionId);
      res.json({ success: true, subscription });
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      res.status(500).json({ error: "Failed to reactivate subscription" });
    }
  });

  app.post("/api/stripe/portal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserById(userId);
      if (!user?.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const baseUrl = getFrontendBaseUrl(req);
      const session = await stripeService.createCustomerPortalSession(
        user.stripeCustomerId,
        `${baseUrl}/subscription`
      );

      res.json({ url: session.url });
    } catch (error) {
      console.error("Failed to create portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  app.get("/api/stripe/subscription", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserById(userId);
      if (!user?.stripeCustomerId) {
        return res.json({ subscription: null });
      }

      const subscriptions = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
      const activeSubscription = subscriptions.data.find(s => 
        s.status === 'active' || s.status === 'trialing'
      );

      res.json({ subscription: activeSubscription || null });
    } catch (error) {
      console.error("Failed to get subscription:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  app.post("/api/stripe/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.userId;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const user = await storage.getUserById(userId);
      if (!user?.stripeCustomerId) {
        return res.json({ synced: false, message: "No Stripe customer found" });
      }

      const subscriptions = await stripeService.getCustomerSubscriptions(user.stripeCustomerId);
      const activeSubscription = subscriptions.data.find(s => 
        s.status === 'active' || s.status === 'trialing'
      );

      if (activeSubscription) {
        const activePriceId = activeSubscription.items?.data?.[0]?.price?.id;
        let matchedPlanId: string | undefined;
        if (activePriceId) {
          const allPlans = await storage.getActiveSubscriptionPlans();
          const matchedPlan = allPlans.find(p => p.stripePriceId === activePriceId);
          if (matchedPlan) {
            matchedPlanId = matchedPlan.id.toString();
          }
        }
        await storage.updateUserStripeInfo(userId, {
          stripeSubscriptionId: activeSubscription.id,
          subscriptionEndDate: activeSubscription.current_period_end 
            ? new Date(activeSubscription.current_period_end * 1000) 
            : undefined,
          subscriptionPlanId: matchedPlanId,
        });
        res.json({ synced: true, subscription: activeSubscription });
      } else {
        const allPlans = await storage.getActiveSubscriptionPlans();
        const defaultPlan = allPlans.find(p => p.isDefault);
        await storage.updateUserStripeInfo(userId, {
          stripeSubscriptionId: undefined,
          subscriptionEndDate: undefined,
          subscriptionPlanId: defaultPlan ? defaultPlan.id.toString() : undefined,
        });
        res.json({ synced: true, subscription: null });
      }
    } catch (error) {
      console.error("Failed to sync subscription:", error);
      res.status(500).json({ error: "Failed to sync subscription" });
    }
  });

  app.get("/robots.txt", (req, res) => {
    const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host || req.hostname;
    const baseUrl = `${protocol}://${host}`;
    
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Disallow: /auth/

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.set("Content-Type", "text/plain");
    res.send(robotsTxt);
  });

  app.get("/sitemap.xml", async (req, res) => {
    try {
      const articles = await storage.getArticles();
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host || req.hostname;
      const baseUrl = `${protocol}://${host}`;
      
      let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/articles</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/events</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/vibe</loc>
    <changefreq>hourly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/reviews</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`;

      for (const article of articles) {
        xml += `
  <url>
    <loc>${baseUrl}/articles/${article.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

      const events = await storage.getEvents();
      for (const event of events) {
        xml += `
  <url>
    <loc>${baseUrl}/events/${event.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      }

      const vibes = await storage.getVibes();
      for (const vibe of vibes) {
        xml += `
  <url>
    <loc>${baseUrl}/vibe/${vibe.id}</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>`;
      }

      const reviews = await storage.getApprovedReviews();
      for (const review of reviews) {
        if (review.slug) {
          xml += `
  <url>
    <loc>${baseUrl}/reviews/${review.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      }

      const groups = await storage.getGroups();
      for (const group of groups) {
        if (group.isPublic && group.slug) {
          xml += `
  <url>
    <loc>${baseUrl}/groups/${group.slug}</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>`;
        }
      }

      xml += `
</urlset>`;

      res.set("Content-Type", "application/xml");
      res.send(xml);
    } catch (error) {
      console.error("Sitemap generation error:", error);
      res.status(500).send("Failed to generate sitemap");
    }
  });

  app.get("/api/tenants", isAdmin, async (req, res) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: (req as any).userId } });
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }
      const tenants = await storage.getTenants();
      res.json(tenants);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      res.status(500).json({ error: "Failed to fetch tenants" });
    }
  });

  app.get("/api/tenants/:id", isAdmin, async (req, res) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: (req as any).userId } });
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }
      const tenant = await storage.getTenantById(req.params.id);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      const adminUser = await prisma.users.findFirst({
        where: { tenantId: req.params.id, isAdmin: true },
        select: { id: true, email: true, mumblesVibeName: true },
      });
      res.json({ ...tenant, adminEmail: adminUser?.email || "", adminName: adminUser?.mumblesVibeName || "", adminUserId: adminUser?.id || null });
    } catch (error) {
      console.error("Error fetching tenant:", error);
      res.status(500).json({ error: "Failed to fetch tenant" });
    }
  });

  app.post("/api/tenants/custom-domain/dns", isAdmin, async (req, res) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: (req as any).userId } });
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const customDomainSchema = z.object({
        domainName: z.string().min(1, "domainName is required"),
        applyNginx: z.boolean().optional().default(false),
      });

      const parsed = customDomainSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: "Invalid custom domain request",
          details: parsed.error.flatten(),
        });
      }

      const { domainName, applyNginx } = parsed.data;
      const normalized = domainName
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/\/$/, "")
        .split("/")[0]
        .replace(/\.$/, "");

      const isValidDomain = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(normalized);
      if (!isValidDomain) {
        return res.status(400).json({ error: "Invalid domain name format" });
      }

      const baseDomain = normalized.replace(/^www\./, "");
      const targetIp = process.env.SERVER_PUBLIC_IP || null;
      const verificationToken = `orbit8-domain-verification=${baseDomain}`;

      //let nginxWarning: string | null = null;
      // if (applyNginx) {
      //   try {
      //     ensureTenantNginxConfig(baseDomain);
      //   } catch (error) {
      //     nginxWarning = error instanceof Error ? error.message : "Failed to update NGINX";
      //     console.error("NGINX custom domain config update failed:", error);
      //   }
      // }

      const dnsEntries = [
        {
          type: "A",
          host: "@",
          value: targetIp,
          ttl: 300,
          required: true,
          note: targetIp ? "Points apex domain to Orbit8 host" : "Set NGINX_PUBLIC_IP or SERVER_PUBLIC_IP env var on backend",
        },
        {
          type: "CNAME",
          host: "www",
          value: baseDomain,
          ttl: 300,
          required: false,
          note: "Optional www alias",
        },
        {
          type: "TXT",
          host: "@",
          value: verificationToken,
          ttl: 300,
          required: false,
          note: "Optional ownership verification",
        },
      ];

      return res.json({
        domainName: baseDomain,
        applyNginx,
        //nginxWarning,
        dnsEntries,
        nextSteps: [
          "Create DNS records in your registrar/DNS provider",
          "Wait for propagation (can be a few minutes to 24h)",
          "After propagation, create/update tenant with this domainName",
        ],
      });
    } catch (error) {
      console.error("Error generating custom domain DNS entries:", error);
      return res.status(500).json({ error: "Failed to generate DNS entries" });
    }
  });

  app.post("/api/tenants", isAdmin, async (req, res) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: (req as any).userId } });
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const parsed = insertTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid tenant data", details: parsed.error.flatten() });
      }

      const { name, domainName, subDomain, adminEmail, adminPassword, adminName } = parsed.data;

      const existingUser = await prisma.users.findUnique({ where: { email: adminEmail } });
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }

      const bcrypt = await import("bcrypt");
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenants.create({ data: { name, domainName: domainName || null, subDomain: subDomain || null } });
        await tx.users.create({
          data: {
            email: adminEmail,
            passwordHash,
            mumblesVibeName: adminName,
            isAdmin: true,
            isSuperAdmin: true,
            tenantId: tenant.id,
            adminArticles: true,
            adminEvents: true,
            adminReviews: true,
            adminPosts: true,
            adminGroups: true,
            adminPodcasts: true,
          }
        });
        await tx.heroSettings.create({
          data: {
            title: name,
            subtitle: "Add your subtitle in admin",
            imageUrl: "/images/default_golf_hero.png",
            tenantId: tenant.id,
          }
        });
        await tx.articleCategories.create({
          data: {
            name: "Default Category",
            icon: "folder",
            orderIndex: 0,
            tenantId: tenant.id,
          }
        });
        await tx.eventCategories.create({
          data: {
            name: "Default Category",
            icon: "calendar",
            orderIndex: 0,
            tenantId: tenant.id,
          }
        });
        await tx.reviewCategories.create({
          data: {
            name: "Default Category",
            icon: "folder",
            orderIndex: 0,
            tenantId: tenant.id,
          }
        });
        await tx.siteSettings.create({
          data: {
            platformName: name,
            tagline: "Add your tagline in admin",
            tenantId: tenant.id,
          }
        });
        return tenant;
      });

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating tenant:", error);
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });

  app.patch("/api/tenants/:id", isAdmin, async (req, res) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: (req as any).userId } });
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }
      const updateSchema = z.object({
        name: z.string().min(1).optional(),
        domainName: z.string().nullable().optional(),
        subDomain: z.string().nullable().optional(),
        adminName: z.string().optional(),
        adminEmail: z.string().email().optional(),
        adminPassword: z.string().min(6).optional(),
      });
      const parsed = updateSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid update data", details: parsed.error.flatten() });
      }
      const { adminName, adminEmail, adminPassword, ...tenantData } = parsed.data;
      const tenant = await storage.updateTenant(req.params.id, tenantData);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      if (tenantData.name) {
        const heroSettings = await prisma.heroSettings.findFirst({ where: { tenantId: req.params.id } });
        if (heroSettings) {
          await prisma.heroSettings.update({ where: { id: heroSettings.id }, data: { title: tenantData.name } });
        }
        const siteSettings = await prisma.siteSettings.findFirst({ where: { tenantId: req.params.id } });
        if (siteSettings) {
          await prisma.siteSettings.update({ where: { id: siteSettings.id }, data: { platformName: tenantData.name } });
        }
      }
      if (adminName || adminEmail || adminPassword) {
        const adminUser = await prisma.users.findFirst({
          where: { tenantId: req.params.id, isAdmin: true },
        });
        if (adminUser) {
          const adminUpdates: any = {};
          if (adminName) adminUpdates.mumblesVibeName = adminName;
          if (adminEmail) {
            const existingEmail = await prisma.users.findFirst({
              where: { email: adminEmail, id: { not: adminUser.id } },
            });
            if (existingEmail) {
              return res.status(400).json({ error: "A user with this email already exists" });
            }
            adminUpdates.email = adminEmail;
          }
          if (adminPassword) {
            const bcrypt = await import("bcrypt");
            adminUpdates.passwordHash = await bcrypt.hash(adminPassword, 10);
          }
          await prisma.users.update({ where: { id: adminUser.id }, data: adminUpdates });
        }
      }
      const adminUser = await prisma.users.findFirst({
        where: { tenantId: req.params.id, isAdmin: true },
        select: { id: true, email: true, mumblesVibeName: true },
      });
      res.json({ ...tenant, adminEmail: adminUser?.email || "", adminName: adminUser?.mumblesVibeName || "", adminUserId: adminUser?.id || null });
    } catch (error) {
      console.error("Error updating tenant:", error);
      res.status(500).json({ error: "Failed to update tenant" });
    }
  });

  app.delete("/api/tenants/:id", isAdmin, async (req, res) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: (req as any).userId } });
      if (!user?.isSuperAdmin) {
        return res.status(403).json({ error: "Super admin access required" });
      }
      const deleted = await storage.deleteTenant(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Tenant not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tenant:", error);
      res.status(500).json({ error: "Failed to delete tenant" });
    }
  });

  app.post("/api/onboarding/tenant", async (req, res) => {
    try {
      const apiKey = req.headers["x-api-key"] || req.headers["authorization"]?.replace("Bearer ", "");
      const expectedKey = process.env.ONBOARDING_API_KEY;
      if (!expectedKey) {
        return res.status(503).json({ error: "Onboarding endpoint not configured. Set ONBOARDING_API_KEY environment variable." });
      }
      if (apiKey !== expectedKey) {
        return res.status(401).json({ error: "Invalid or missing API key" });
      }

      const { insertTenantSchema } = await import("@shared/schema");
      const parsed = insertTenantSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid tenant data", details: parsed.error.flatten() });
      }

      const { name, domainName, subDomain, adminEmail, adminPassword, adminName } = parsed.data;

      const existingUser = await prisma.users.findUnique({ where: { email: adminEmail } });
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }

      const existingTenant = await prisma.tenants.findFirst({ where: { name } });
      if (existingTenant) {
        return res.status(400).json({ error: "A tenant with this name already exists" });
      }

      const bcrypt = await import("bcrypt");
      const passwordHash = await bcrypt.hash(adminPassword, 10);

      const result = await prisma.$transaction(async (tx) => {
        const tenant = await tx.tenants.create({ data: { name, domainName: domainName || null, subDomain: subDomain || null } });
        const adminUser = await tx.users.create({
          data: {
            email: adminEmail,
            passwordHash,
            mumblesVibeName: adminName,
            isAdmin: true,
            isSuperAdmin: true,
            tenantId: tenant.id,
            adminArticles: true,
            adminEvents: true,
            adminReviews: true,
            adminPosts: true,
            adminGroups: true,
            adminPodcasts: true,
          }
        });
        await tx.heroSettings.create({
          data: {
            title: name,
            subtitle: "Add your subtitle in admin",
            imageUrl: "/images/default_golf_hero.png",
            tenantId: tenant.id,
          }
        });
        await tx.articleCategories.create({
          data: { name: "Default Category", icon: "folder", orderIndex: 0, tenantId: tenant.id }
        });
        await tx.eventCategories.create({
          data: { name: "Default Category", icon: "calendar", orderIndex: 0, tenantId: tenant.id }
        });
        await tx.reviewCategories.create({
          data: { name: "Default Category", icon: "folder", orderIndex: 0, tenantId: tenant.id }
        });
        await tx.siteSettings.create({
          data: {
            platformName: name,
            tagline: "Add your tagline in admin",
            tenantId: tenant.id,
          }
        });
        return { tenant, adminUser: { id: adminUser.id, email: adminUser.email, name: adminUser.mumblesVibeName } };
      });

      console.log(`[onboarding] Tenant "${name}" created via onboarding API (id: ${result.tenant.id})`);
      res.status(201).json({
        success: true,
        tenant: result.tenant,
        admin: result.adminUser,
      });
    } catch (error) {
      console.error("Error in onboarding tenant creation:", error);
      res.status(500).json({ error: "Failed to create tenant" });
    }
  });

  registerDnsSslRoutes(app);

  // GET /api/domain/check?domain=<domain>
  // Returns whether the given domain is fully configured (isDNSConfigured === 1)
  app.get("/api/domain/check", checkDomainHandler);

  return httpServer;
}
