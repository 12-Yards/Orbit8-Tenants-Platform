import { PrismaClient } from "@prisma/client";
import { AsyncLocalStorage } from "async_hooks";

export const prisma = new PrismaClient();

export const db = prisma;

export const tenantContext = new AsyncLocalStorage<string | null>();

export function getCurrentTenantId(): string | null {
  return tenantContext.getStore() ?? null;
}

export function getDb(): any {
  return getTenantPrisma(getCurrentTenantId());
}

const TENANT_EXCLUDED_MODELS = ['tenants', 'sessions'];

export function getTenantPrisma(tenantId: string | null) {
  const tenantFilter = tenantId ? tenantId : null;
  
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          args.where = { ...args.where, tenantId: tenantFilter };
          return query(args);
        },
        async findFirst({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          args.where = { ...args.where, tenantId: tenantFilter };
          return query(args);
        },
        async findUnique({ model, args, query }: any) {
          return query(args);
        },
        async create({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          args.data = { ...args.data, tenantId: tenantFilter };
          return query(args);
        },
        async createMany({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          if (Array.isArray(args.data)) {
            args.data = args.data.map((d: any) => ({ ...d, tenantId: tenantFilter }));
          } else {
            args.data = { ...args.data, tenantId: tenantFilter };
          }
          return query(args);
        },
        async update({ model, args, query }: any) {
          return query(args);
        },
        async updateMany({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          args.where = { ...args.where, tenantId: tenantFilter };
          return query(args);
        },
        async delete({ model, args, query }: any) {
          return query(args);
        },
        async deleteMany({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          args.where = { ...args.where, tenantId: tenantFilter };
          return query(args);
        },
        async count({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          args.where = { ...args.where, tenantId: tenantFilter };
          return query(args);
        },
        async aggregate({ model, args, query }: any) {
          if (TENANT_EXCLUDED_MODELS.includes(model.toLowerCase())) return query(args);
          args.where = { ...args.where, tenantId: tenantFilter };
          return query(args);
        },
      },
    },
  });
}

export async function ensureTablesExist() {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        platform_name text DEFAULT 'Mumbles Vibe',
        show_stay boolean DEFAULT true,
        show_events boolean DEFAULT true,
        show_reviews boolean DEFAULT true,
        show_community boolean DEFAULT true,
        show_ecommerce boolean DEFAULT false,
        updated_at timestamp DEFAULT now()
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS platform_name text DEFAULT 'Mumbles Vibe';
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS twitter_url text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instagram_url text;
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS tagline text DEFAULT 'Your community guide to the beautiful seaside village of Mumbles, Swansea. Discover local gems, upcoming events, and find the perfect place to stay.';
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_url text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS terms_of_service text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS privacy_policy text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS allow_platform_login boolean DEFAULT true;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS groups (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        name text NOT NULL,
        slug text NOT NULL UNIQUE,
        description text NOT NULL,
        image_url text,
        created_by varchar(255) NOT NULL,
        created_at timestamp DEFAULT now(),
        is_active boolean DEFAULT true,
        is_public boolean DEFAULT false
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS group_memberships (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        role text DEFAULT 'member' NOT NULL,
        status text DEFAULT 'pending' NOT NULL,
        requested_at timestamp DEFAULT now(),
        approved_at timestamp,
        approved_by varchar(255)
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS group_posts (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        content text NOT NULL,
        category text DEFAULT 'Social' NOT NULL,
        post_type text DEFAULT 'post' NOT NULL,
        image_urls json DEFAULT '[]'::json,
        created_at timestamp DEFAULT now(),
        updated_at timestamp,
        edited boolean DEFAULT false
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS group_post_comments (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        parent_comment_id varchar(36),
        content text NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS group_post_reactions (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        reaction_type text NOT NULL
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS group_events (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        name text NOT NULL,
        start_date text NOT NULL,
        end_date text,
        venue_name text NOT NULL,
        address text NOT NULL,
        summary text NOT NULL,
        description text NOT NULL,
        image_url text,
        tags json DEFAULT '[]'::json,
        ticket_url text,
        show_on_public boolean DEFAULT false,
        created_at timestamp DEFAULT now()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS group_event_comments (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        parent_comment_id varchar(36),
        content text NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS group_event_reactions (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        reaction_type text NOT NULL
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_categories (
        id serial PRIMARY KEY,
        name text NOT NULL UNIQUE,
        icon text DEFAULT 'calendar',
        order_index integer DEFAULT 0,
        created_at timestamp DEFAULT now()
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_entries (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id varchar(36) NOT NULL,
        user_id varchar(36) NOT NULL,
        team_name text,
        player_names json DEFAULT '[]'::json,
        entered_at timestamp DEFAULT now(),
        payment_status text DEFAULT 'pending',
        payment_amount text
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id varchar(36) NOT NULL,
        user_id varchar(255) NOT NULL,
        created_at timestamp DEFAULT now()
      );
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'attending';
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_suggestions ADD COLUMN IF NOT EXISTS approved_event_id VARCHAR(36);
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_suggestions ADD COLUMN IF NOT EXISTS group_event_id VARCHAR(36);
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE event_entries ADD COLUMN IF NOT EXISTS player_handicaps json DEFAULT '{}'::json;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_last_seen_entrant_count integer DEFAULT 0;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE article_sections ADD COLUMN IF NOT EXISTS mux_playback_id text;
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE article_sections ADD COLUMN IF NOT EXISTS mux_asset_id text;
    `);

    await prisma.$executeRawUnsafe(`
      UPDATE tenants SET sub_domain = NULL WHERE sub_domain = '';
    `);
    await prisma.$executeRawUnsafe(`
      UPDATE tenants SET domain_name = NULL WHERE domain_name = '';
    `);

    const uniqueConstraintMigrations = [
      { table: 'article_categories', column: 'name', oldConstraint: 'article_categories_name_key' },
      { table: 'event_categories', column: 'name', oldConstraint: 'event_categories_name_key' },
      { table: 'review_categories', column: 'name', oldConstraint: 'review_categories_name_key' },
      { table: 'articles', column: 'slug', oldConstraint: 'articles_slug_unique' },
      { table: 'events', column: 'slug', oldConstraint: 'events_slug_unique' },
      { table: 'groups', column: 'slug', oldConstraint: 'groups_slug_key' },
      { table: 'member_reviews', column: 'slug', oldConstraint: 'member_reviews_slug_unique' },
      { table: 'podcasts', column: 'slug', oldConstraint: 'podcasts_slug_key' },
      { table: 'polls', column: 'slug', oldConstraint: 'polls_slug_unique' },
      { table: 'subscription_plans', column: 'slug', oldConstraint: 'subscription_plans_slug_key' },
      { table: 'newsletter_subscriptions', column: 'email', oldConstraint: 'newsletter_subscriptions_email_unique' },
      { table: 'profile_field_definitions', column: 'slug', oldConstraint: 'profile_field_definitions_slug_key' },
    ];

    for (const { table, column, oldConstraint } of uniqueConstraintMigrations) {
      try {
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${oldConstraint}') THEN
              ALTER TABLE "${table}" DROP CONSTRAINT "${oldConstraint}";
            END IF;
            IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '${oldConstraint}') THEN
              DROP INDEX "${oldConstraint}";
            END IF;
          END $$;
        `);
        const newConstraint = `${table}_${column}_tenant_id_key`;
        await prisma.$executeRawUnsafe(`
          DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = '${newConstraint}') THEN
              CREATE UNIQUE INDEX "${newConstraint}" ON "${table}" ("${column}", "tenant_id");
            END IF;
          END $$;
        `);
      } catch (e) {
        console.log(`Migration for ${table}.${column} already done or skipped:`, (e as any).message);
      }
    }

    console.log("Database tables ensured to exist");
  } catch (error) {
    console.error("Error ensuring tables exist:", error);
  }
}
