import { Express, RequestHandler, Request, Response } from "express";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma, tenantContext } from "./db";

const SALT_ROUNDS = 10;
const JWT_EXPIRY = "7d";
const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
}

function generateToken(userId: string): string {
  return jwt.sign({ userId }, getJwtSecret(), { expiresIn: JWT_EXPIRY });
}

function verifyToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}

function setTokenCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

function clearTokenCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

function getUserIdFromRequest(req: Request): string | null {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return null;
  const decoded = verifyToken(token);
  return decoded?.userId ?? null;
}

export function setupAuth(app: Express) {
  app.set("trust proxy", true);
  app.use(cookieParser());
}

export function registerAuthRoutes(app: Express) {
  const adminOnly: RequestHandler = async (req, res, next) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      (req as any).userId = userId;
      const previewTenantId = (req as any).query?._tenantId as string | undefined;
      const hostResolvedTenantId = (req as any).tenantId;
      if (previewTenantId && user.tenantId === null) {
        (req as any).tenantId = previewTenantId;
      } else if (user.tenantId) {
        (req as any).tenantId = user.tenantId;
      } else if (hostResolvedTenantId) {
        (req as any).tenantId = hostResolvedTenantId;
      } else {
        (req as any).tenantId = null;
      }
      tenantContext.run((req as any).tenantId, () => next());
    } catch (error) {
      console.error("Admin check error:", error);
      res.status(500).json({ error: "Failed to verify admin status" });
    }
  };

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, mumblesVibeName } = req.body;

      if (!email || !password || !mumblesVibeName) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const existingUser = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      const newUser = await prisma.users.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          mumblesVibeName,
          tenantId: (req as any).tenantId || null,
        },
      });

      const token = generateToken(newUser.id);
      setTokenCookie(res, token);

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        mumblesVibeName: newUser.mumblesVibeName,
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      const user = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
      
      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (user.blocked) {
        return res.status(403).json({ error: "Your account has been blocked. Please contact support." });
      }

      const token = generateToken(user.id);
      setTokenCookie(res, token);

      res.json({
        id: user.id,
        email: user.email,
        mumblesVibeName: user.mumblesVibeName,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to log in" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    clearTokenCookie(res);
    res.json({ success: true });
  });

  app.get("/api/auth/logout", (req, res) => {
    clearTokenCookie(res);
    res.redirect("/");
  });

  app.get("/api/auth/sso", async (req, res) => {
    try {
      const { email, timestamp, signature, provider } = req.query;
      
      if (!email || !timestamp || !signature || !provider) {
        return res.status(400).json({ error: "Missing required SSO parameters" });
      }
      
      if (typeof email !== "string" || typeof timestamp !== "string" || 
          typeof signature !== "string" || typeof provider !== "string") {
        return res.status(400).json({ error: "Invalid SSO parameter types" });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      const ssoSecret = process.env.SSO_SECRET;
      if (!ssoSecret) {
        console.error("SSO_SECRET environment variable not set");
        return res.status(500).json({ error: "SSO not configured" });
      }

      const ts = parseInt(timestamp, 10);
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;
      
      if (isNaN(ts) || Math.abs(now - ts) > fiveMinutes) {
        return res.status(401).json({ error: "SSO link expired" });
      }

      const expectedSignature = crypto
        .createHmac("sha256", ssoSecret)
        .update(`${email}:${timestamp}:${provider}`)
        .digest("hex");

      const signatureBuffer = Buffer.from(signature, "hex");
      const expectedBuffer = Buffer.from(expectedSignature, "hex");
      
      if (signatureBuffer.length !== expectedBuffer.length || 
          !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return res.status(401).json({ error: "Invalid SSO signature" });
      }

      const emailLower = email.toLowerCase();
      const ssoProvider = provider;

      let existingUser = await prisma.users.findUnique({ where: { email: emailLower } });
      
      let isFirstLogin = false;

      if (!existingUser) {
        const newUser = await prisma.users.create({
          data: {
            email: emailLower,
            mumblesVibeName: emailLower.split("@")[0],
            ssoLinked: true,
            ssoProvider: ssoProvider,
            ssoFirstLoginComplete: false,
            tenantId: (req as any).tenantId || null,
          },
        });
        
        existingUser = newUser;
        isFirstLogin = true;
        console.log(`SSO: Created new user ${emailLower} via ${ssoProvider}`);
      } else {
        if (!existingUser.ssoLinked) {
          if (existingUser.passwordHash) {
            console.warn(`SSO: Attempted to link to existing local account ${emailLower} - requires manual linking`);
            return res.status(403).json({ 
              error: "This email is already registered with a password. Please log in with your password first, then link your SSO account from your profile." 
            });
          }
          
          await prisma.users.update({
            where: { id: existingUser.id },
            data: { 
              ssoLinked: true, 
              ssoProvider: ssoProvider,
              ssoFirstLoginComplete: false 
            },
          });
          
          isFirstLogin = true;
          console.log(`SSO: Linked existing user ${emailLower} to ${ssoProvider}`);
        } else if (!existingUser.ssoFirstLoginComplete) {
          isFirstLogin = true;
        }
      }

      if (existingUser.blocked) {
        return res.status(403).json({ error: "Account is blocked" });
      }

      const token = generateToken(existingUser.id);
      setTokenCookie(res, token);

      await prisma.users.update({
        where: { id: existingUser.id },
        data: { lastActiveAt: new Date() },
      });

      if (isFirstLogin) {
        return res.redirect("/profile?sso=true&first=true");
      } else {
        return res.redirect("/?sso=true");
      }
    } catch (error) {
      console.error("SSO error:", error);
      res.status(500).json({ error: "SSO authentication failed" });
    }
  });

  app.post("/api/auth/sso/complete-first-login", async (req, res) => {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      await prisma.users.update({
        where: { id: userId },
        data: { ssoFirstLoginComplete: true },
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to complete SSO first login:", error);
      res.status(500).json({ error: "Failed to complete setup" });
    }
  });

  app.get("/api/auth/user", async (req, res) => {
    const userId = getUserIdFromRequest(req);
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const user = await prisma.users.findUnique({ where: { id: userId } });
      
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      if (user.blocked) {
        clearTokenCookie(res);
        return res.status(403).json({ error: "Your account has been blocked" });
      }

      let subscriptionFeatures = {
        featureEditorial: false,
        featureEventsStandard: false,
        featureEventsCompetitions: false,
        featureReviews: false,
        featureCommunities: false,
        featureConnections: false,
        featurePlay: false,
        featurePlayAddRequest: false,
        featureSuggestEvent: false,
      };

      if (user.subscriptionPlanId) {
        const plan = await prisma.subscriptionPlans.findUnique({ where: { id: parseInt(user.subscriptionPlanId) } });
        if (plan) {
          subscriptionFeatures = {
            featureEditorial: plan.featureEditorial || false,
            featureEventsStandard: plan.featureEventsStandard || false,
            featureEventsCompetitions: plan.featureEventsCompetitions || false,
            featureReviews: plan.featureReviews || false,
            featureCommunities: plan.featureCommunities || false,
            featureConnections: plan.featureConnections || false,
            featurePlay: plan.featurePlay || false,
            featurePlayAddRequest: plan.featurePlayAddRequest || false,
            featureSuggestEvent: plan.featureSuggestEvent || false,
          };
        }
      } else {
        const defaultPlan = await prisma.subscriptionPlans.findFirst({ where: { isDefault: true } });
        if (defaultPlan) {
          await prisma.users.update({
            where: { id: userId },
            data: { 
              subscriptionPlanId: defaultPlan.id.toString(),
              subscriptionStartDate: new Date()
            },
          });
          
          subscriptionFeatures = {
            featureEditorial: defaultPlan.featureEditorial || false,
            featureEventsStandard: defaultPlan.featureEventsStandard || false,
            featureEventsCompetitions: defaultPlan.featureEventsCompetitions || false,
            featureReviews: defaultPlan.featureReviews || false,
            featureCommunities: defaultPlan.featureCommunities || false,
            featureConnections: defaultPlan.featureConnections || false,
            featurePlay: defaultPlan.featurePlay || false,
            featurePlayAddRequest: defaultPlan.featurePlayAddRequest || false,
            featureSuggestEvent: defaultPlan.featureSuggestEvent || false,
          };
        }
      }

      res.json({
        id: user.id,
        email: user.email,
        mumblesVibeName: user.mumblesVibeName,
        profileImageUrl: user.profileImageUrl || null,
        isAdmin: user.isAdmin || false,
        isSuperAdmin: user.isSuperAdmin || false,
        adminArticles: user.adminArticles || false,
        adminEvents: user.adminEvents || false,
        adminReviews: user.adminReviews || false,
        adminPosts: user.adminPosts || false,
        adminGroups: user.adminGroups || false,
        adminPodcasts: user.adminPodcasts || false,
        ssoLinked: user.ssoLinked || false,
        ssoProvider: user.ssoProvider || null,
        ssoFirstLoginComplete: user.ssoFirstLoginComplete || false,
        ...subscriptionFeatures,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  app.get("/api/admin/users", adminOnly, async (req: any, res) => {
    try {
      const tenantId = req.tenantId || null;
      const allUsers = await prisma.users.findMany({
        where: { tenantId: tenantId },
        select: {
          id: true,
          email: true,
          mumblesVibeName: true,
          blocked: true,
          isAdmin: true,
          isSuperAdmin: true,
          adminArticles: true,
          adminEvents: true,
          adminReviews: true,
          adminPosts: true,
          adminGroups: true,
          adminPodcasts: true,
          createdAt: true,
          lastActiveAt: true,
          subscriptionPlanId: true,
          subscriptionEndDate: true,
          stripeSubscriptionId: true,
          profileImageUrl: true,
          tenantId: true,
        },
      });
      
      res.json(allUsers);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  app.post("/api/admin/users", adminOnly, async (req: any, res) => {
    try {
      const currentUser = await prisma.users.findUnique({ where: { id: req.userId } });
      if (!currentUser || !currentUser.isSuperAdmin) {
        return res.status(403).json({ error: "Only Super Admins can create admin users" });
      }
      
      const { email, password, mumblesVibeName, isSuperAdmin, adminArticles, adminEvents, adminReviews, adminPosts, adminGroups, adminPodcasts } = req.body;
      
      if (!email || !password || !mumblesVibeName) {
        return res.status(400).json({ error: "Email, password, and username are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      
      const existingUser = await prisma.users.findUnique({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ error: "A user with this email already exists" });
      }
      
      const existingName = await prisma.users.findFirst({ where: { mumblesVibeName } });
      if (existingName) {
        return res.status(400).json({ error: "This username is already taken" });
      }
      
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      
      const newUser = await prisma.users.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          mumblesVibeName,
          isAdmin: true,
          isSuperAdmin: Boolean(isSuperAdmin),
          tenantId: req.tenantId || null,
          adminArticles: isSuperAdmin ? true : Boolean(adminArticles),
          adminEvents: isSuperAdmin ? true : Boolean(adminEvents),
          adminReviews: isSuperAdmin ? true : Boolean(adminReviews),
          adminPosts: isSuperAdmin ? true : Boolean(adminPosts),
          adminGroups: isSuperAdmin ? true : Boolean(adminGroups),
          adminPodcasts: isSuperAdmin ? true : Boolean(adminPodcasts),
        },
      });
      
      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        mumblesVibeName: newUser.mumblesVibeName,
        isAdmin: newUser.isAdmin,
        isSuperAdmin: newUser.isSuperAdmin,
        adminArticles: newUser.adminArticles,
        adminEvents: newUser.adminEvents,
        adminReviews: newUser.adminReviews,
        adminPosts: newUser.adminPosts,
        adminGroups: newUser.adminGroups,
        adminPodcasts: newUser.adminPodcasts,
      });
    } catch (error) {
      console.error("Create admin user error:", error);
      res.status(500).json({ error: "Failed to create admin user" });
    }
  });

  app.patch("/api/admin/users/:id", adminOnly, async (req: any, res) => {
    try {
      const currentUser = await prisma.users.findUnique({ where: { id: req.userId } });
      if (!currentUser || !currentUser.isSuperAdmin) {
        return res.status(403).json({ error: "Only Super Admins can edit admin users" });
      }

      const { id } = req.params;
      const { isSuperAdmin, adminArticles, adminEvents, adminReviews, adminPosts, adminGroups, adminPodcasts, isAdmin } = req.body;

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (typeof isAdmin === "boolean") {
        updateData.isAdmin = isAdmin;
        if (!isAdmin) {
          updateData.isSuperAdmin = false;
          updateData.adminArticles = false;
          updateData.adminEvents = false;
          updateData.adminReviews = false;
          updateData.adminPosts = false;
          updateData.adminGroups = false;
          updateData.adminPodcasts = false;
        }
      }

      if (isAdmin !== false) {
        if (typeof isSuperAdmin === "boolean") {
          updateData.isSuperAdmin = isSuperAdmin;
          if (isSuperAdmin) {
            updateData.adminArticles = true;
            updateData.adminEvents = true;
            updateData.adminReviews = true;
            updateData.adminPosts = true;
            updateData.adminGroups = true;
            updateData.adminPodcasts = true;
          }
        }
        if (!isSuperAdmin) {
          if (typeof adminArticles === "boolean") updateData.adminArticles = adminArticles;
          if (typeof adminEvents === "boolean") updateData.adminEvents = adminEvents;
          if (typeof adminReviews === "boolean") updateData.adminReviews = adminReviews;
          if (typeof adminPosts === "boolean") updateData.adminPosts = adminPosts;
          if (typeof adminGroups === "boolean") updateData.adminGroups = adminGroups;
          if (typeof adminPodcasts === "boolean") updateData.adminPodcasts = adminPodcasts;
        }
      }

      const updatedUser = await prisma.users.update({
        where: { id },
        data: updateData,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        mumblesVibeName: updatedUser.mumblesVibeName,
        isAdmin: updatedUser.isAdmin,
        isSuperAdmin: updatedUser.isSuperAdmin,
        adminArticles: updatedUser.adminArticles,
        adminEvents: updatedUser.adminEvents,
        adminReviews: updatedUser.adminReviews,
        adminPosts: updatedUser.adminPosts,
        adminGroups: updatedUser.adminGroups,
        adminPodcasts: updatedUser.adminPodcasts,
      });
    } catch (error) {
      console.error("Update admin user error:", error);
      res.status(500).json({ error: "Failed to update admin user" });
    }
  });

  app.patch("/api/admin/users/:id/block", adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const { blocked } = req.body;
      const adminUserId = getUserIdFromRequest(req);

      if (id === adminUserId) {
        return res.status(403).json({ error: "Cannot block your own account" });
      }

      const updatedUser = await prisma.users.update({
        where: { id },
        data: { blocked: Boolean(blocked), updatedAt: new Date() },
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        mumblesVibeName: updatedUser.mumblesVibeName,
        blocked: updatedUser.blocked,
      });
    } catch (error) {
      console.error("Block user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  app.patch("/api/admin/users/:id/password", adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const { password } = req.body;
      const adminUserId = getUserIdFromRequest(req);

      const adminUser = await prisma.users.findUnique({ where: { id: adminUserId! } });
      if (!adminUser?.isSuperAdmin) {
        return res.status(403).json({ error: "Super Admin access required" });
      }

      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const updatedUser = await prisma.users.update({
        where: { id },
        data: { passwordHash, updatedAt: new Date() },
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.delete("/api/admin/users/:id", adminOnly, async (req, res) => {
    try {
      const { id } = req.params;
      const adminUserId = getUserIdFromRequest(req);

      const adminUser = await prisma.users.findUnique({ where: { id: adminUserId! } });
      if (!adminUser?.isSuperAdmin) {
        return res.status(403).json({ error: "Super Admin access required" });
      }

      const targetUser = await prisma.users.findUnique({ where: { id } });
      if (!targetUser) {
        return res.status(404).json({ error: "User not found" });
      }

      if (targetUser.isSuperAdmin) {
        return res.status(403).json({ error: "Cannot delete a Super Admin" });
      }

      if (id === adminUserId) {
        return res.status(403).json({ error: "Cannot delete your own account" });
      }

      await prisma.users.delete({ where: { id } });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const userId = getUserIdFromRequest(req);
  
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: userId }, select: { id: true, blocked: true, tenantId: true } });
    if (!user) {
      clearTokenCookie(res);
      return res.status(401).json({ error: "User not found" });
    }
    if (user.blocked) {
      clearTokenCookie(res);
      return res.status(403).json({ error: "Your account has been blocked" });
    }
    const previewTenantId = (req as any).query?._tenantId as string | undefined;
    const hostResolvedTenantId = (req as any).tenantId;
    if (previewTenantId && user.tenantId === null) {
      (req as any).tenantId = previewTenantId;
    } else if (user.tenantId) {
      (req as any).tenantId = user.tenantId;
    } else if (hostResolvedTenantId) {
      (req as any).tenantId = hostResolvedTenantId;
    } else {
      (req as any).tenantId = null;
    }
  } catch (err) {
    console.error("Failed to verify user:", err);
    return res.status(500).json({ error: "Authentication error" });
  }

  prisma.users.update({
    where: { id: userId },
    data: { lastActiveAt: new Date() },
  })
    .catch(err => console.error("Failed to update lastActiveAt:", err));

  (req as any).userId = userId;
  tenantContext.run((req as any).tenantId, () => next());
};

export const optionalAuth: RequestHandler = async (req, res, next) => {
  const userId = getUserIdFromRequest(req);
  if (userId) {
    (req as any).userId = userId;
    try {
      const user = await prisma.users.findUnique({ where: { id: userId }, select: { tenantId: true } });
      const previewTenantId = (req as any).query?._tenantId as string | undefined;
      const hostResolvedTenantId = (req as any).tenantId;
      if (previewTenantId && (user?.tenantId === null || user?.tenantId === undefined)) {
        (req as any).tenantId = previewTenantId;
      } else if (user?.tenantId) {
        (req as any).tenantId = user.tenantId;
      } else if (hostResolvedTenantId) {
        (req as any).tenantId = hostResolvedTenantId;
      } else {
        (req as any).tenantId = null;
      }
    } catch {}
    prisma.users.update({
      where: { id: userId },
      data: { lastActiveAt: new Date() },
    })
      .catch(err => console.error("Failed to update lastActiveAt:", err));
  }
  tenantContext.run((req as any).tenantId || null, () => next());
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  const userId = getUserIdFromRequest(req);
  
  if (!userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: "Admin access required" });
    }

    (req as any).userId = userId;
    const previewTenantId = (req as any).query?._tenantId as string | undefined;
    const hostResolvedTenantId = (req as any).tenantId;
    if (previewTenantId && user.tenantId === null) {
      (req as any).tenantId = previewTenantId;
    } else if (user.tenantId) {
      (req as any).tenantId = user.tenantId;
    } else if (hostResolvedTenantId) {
      (req as any).tenantId = hostResolvedTenantId;
    } else {
      (req as any).tenantId = null;
    }
    tenantContext.run((req as any).tenantId, () => next());
  } catch (error) {
    console.error("Admin check error:", error);
    res.status(500).json({ error: "Failed to verify admin status" });
  }
};

export async function seedAdminUser() {
  const adminEmail = "paul.morgan@12yards.app";
  const adminPassword = "2026Vibe!!!";
  
  try {
    const existingAdmin = await prisma.users.findUnique({ where: { email: adminEmail } });
    
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await prisma.users.create({
        data: {
          email: adminEmail,
          passwordHash,
          mumblesVibeName: "Admin",
          isAdmin: true,
        },
      });
      console.log("Admin user created successfully");
    } else {
      const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);
      await prisma.users.update({
        where: { email: adminEmail },
        data: { passwordHash, isAdmin: true },
      });
      console.log("Admin user password reset and admin privileges confirmed");
    }
  } catch (error) {
    console.error("Error seeding admin user:", error);
  }
}
