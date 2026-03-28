import { prisma } from "./db";

export async function migrateDevDataToProduction() {
  try {
    const settings = await prisma.siteSettings.findFirst();
    if (!settings || settings.platformName === "Golf Junkies") {
      console.log("Production data already migrated or matches dev, skipping.");
      return;
    }

    console.log("Migrating development data to production...");

    await prisma.siteSettings.update({
      where: { id: settings.id },
      data: {
        platformName: "Golf Junkies",
        tagline: "Golf Junkies a golfing community",
        logoUrl: "https://chainenable.sirv.com/uploads/8d73cca0-0de4-4df5-9120-312176829186.png",
        faviconUrl: "/objects/uploads/697864ef-4d7a-4b81-a71b-42f771d242ae",
        twitterUrl: "https://x.com/assa",
        youtubeUrl: "https://www.youtube.com/asas",
        tiktokUrl: "https://tiktok.com/asas",
        ctaHeading: "Want to play more Golf?",
        ctaDescription: "Have a recommendation or need one? Share with the community!!!!",
        ctaButtonText: "Join the Community",
        showWhereToStay: false,
        showPodcasts: true,
        platformLive: true,
        currency: "£",
        allowPlatformLogin: false,
        showEcommerce: true,
      },
    });
    console.log("Site settings migrated.");

    await prisma.heroSettings.updateMany({
      data: {
        title: "Golf Junkies",
        subtitle: "Your golf web site",
        imageUrl: "https://chainenable.sirv.com/uploads/40400c22-6b15-440d-8646-65a351fb6a3f.png",
        ctaText: "Explore Now",
        ctaLink: "/articles",
      },
    });
    console.log("Hero settings migrated.");

    const adminUser = await prisma.users.findFirst({
      where: { email: "paul.morgan@12yards.app" },
    });
    if (adminUser) {
      await prisma.users.update({
        where: { id: adminUser.id },
        data: {
          isAdmin: true,
          isSuperAdmin: true,
          adminArticles: true,
          adminEvents: true,
          adminReviews: true,
          adminPosts: true,
          adminGroups: true,
          adminPodcasts: true,
          mumblesVibeName: "DragonFly",
          passwordHash: "$2b$10$/lAzf//XyL9PZnmIFUec0ewXNKsBXIG9cFMdqfbPJQ3e/sJetjQjm",
        },
      });
      console.log("Admin user permissions migrated.");
    }

    await prisma.articleCategories.deleteMany({});
    const artCats = [
      { name: "Golf", icon: "golf", orderIndex: 0 },
      { name: "Restaurants", icon: "restaurant", orderIndex: 1 },
      { name: "History", icon: "folder", orderIndex: 2 },
      { name: "Beaches", icon: "beach", orderIndex: 3 },
      { name: "Nightlife", icon: "folder", orderIndex: 4 },
      { name: "Local Tips Test", icon: "folder", orderIndex: 5 },
      { name: "Shopping", icon: "gift", orderIndex: 6 },
      { name: "Family", icon: "folder", orderIndex: 7 },
    ];
    for (const cat of artCats) {
      await prisma.articleCategories.create({ data: cat });
    }
    console.log("Article categories migrated.");

    await prisma.eventCategories.deleteMany({});
    const evtCats = [
      { name: "Music", icon: "calendar", orderIndex: 0 },
      { name: "Festival", icon: "calendar", orderIndex: 1 },
      { name: "Sports", icon: "calendar", orderIndex: 2 },
      { name: "Community11", icon: "tree", orderIndex: 3 },
      { name: "Food & Drink", icon: "calendar", orderIndex: 4 },
      { name: "Arts & Culture", icon: "calendar", orderIndex: 5 },
      { name: "Family Friendly", icon: "calendar", orderIndex: 6 },
      { name: "Outdoor", icon: "calendar", orderIndex: 7 },
    ];
    for (const cat of evtCats) {
      await prisma.eventCategories.create({ data: cat });
    }
    console.log("Event categories migrated.");

    await prisma.reviewCategories.deleteMany({});
    const revCats = [
      { name: "Golf Resort", icon: "hot-tub", orderIndex: 0 },
      { name: "Courses", icon: "park", orderIndex: 0 },
    ];
    for (const cat of revCats) {
      await prisma.reviewCategories.create({ data: cat });
    }
    console.log("Review categories migrated.");

    const existingTip = await prisma.insiderTips.findFirst({ where: { title: "Best Coffee" } });
    if (!existingTip) {
      await prisma.insiderTips.create({
        data: {
          title: "Best Coffee",
          tip: "Loads of great coffee places, but Mumbles coffee is my personal favourite",
          author: "John James",
          isActive: true,
        },
      });
      console.log("Insider tips migrated.");
    }

    console.log("Production data migration complete!");
  } catch (error) {
    console.error("Error migrating production data:", error);
  }
}
