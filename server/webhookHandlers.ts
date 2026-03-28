import { getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    let event: any;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (webhookSecret) {
      const stripe = await getUncachableStripeClient();
      event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } else {
      event = JSON.parse(payload.toString());
      console.warn('STRIPE_WEBHOOK_SECRET not set - processing webhook without signature verification');
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data?.object as any;
        
        if (session?.metadata?.type === 'event_entry' && session?.metadata?.entryData && session?.metadata?.eventId) {
          const eventId = session.metadata.eventId;
          
          const eventRecord = await storage.getEventById(eventId);
          if (!eventRecord || !eventRecord.stripePriceId) {
            console.error(`Event ${eventId} not found or has no Stripe price configured`);
            return;
          }
          
          const sessionPriceId = session.metadata?.stripePriceId || null;
          if (sessionPriceId && sessionPriceId !== eventRecord.stripePriceId) {
            console.error(`Price ID mismatch: session used ${sessionPriceId}, expected ${eventRecord.stripePriceId}`);
            return;
          }
          
          let entryInfo;
          try {
            entryInfo = JSON.parse(session.metadata.entryData);
          } catch (parseErr) {
            console.error('Failed to parse entryData from checkout metadata:', parseErr);
            return;
          }
          
          if (entryInfo.eventId !== eventId) {
            console.error(`Metadata mismatch: entryData.eventId=${entryInfo.eventId} vs metadata.eventId=${eventId}`);
            return;
          }
          
          const existingEntry = await storage.getEventEntryByUserAndEvent(eventId, entryInfo.userId);
          if (existingEntry) {
            console.log(`User ${entryInfo.userId} already has entry for event ${eventId}, skipping duplicate`);
            return;
          }
          
          if (eventRecord.maxEntries) {
            const currentCount = await storage.getEventEntryCount(eventId);
            const effectivePlayerCount = entryInfo.playerCount || 1;
            if (currentCount + effectivePlayerCount > eventRecord.maxEntries) {
              console.error(`Event ${eventId} is full (${currentCount}/${eventRecord.maxEntries}). Cannot create entry after payment. Manual refund needed for payment_intent: ${session.payment_intent}`);
              return;
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
            playerCount: entryInfo.playerCount || 1,
            stripePaymentId: session.payment_intent
          });
          
          if (eventRecord.isEventGroup) {
            try {
              let groupId = eventRecord.linkedGroupId;
              let group;
              
              if (!groupId) {
                const newGroup = await storage.createGroup({
                  name: eventRecord.name,
                  description: `Community group for ${eventRecord.name}`,
                  imageUrl: eventRecord.imageUrl,
                  createdBy: entryInfo.userId,
                  isPublic: false,
                  isActive: true,
                  eventId: eventRecord.id,
                });
                groupId = newGroup.id;
                group = newGroup;
                await storage.updateEvent(eventRecord.id, { linkedGroupId: groupId });
              } else {
                group = await storage.getGroupById(groupId);
              }
              
              if (group) {
                const existingMembership = await storage.getGroupMembership(group.id, entryInfo.userId);
                if (!existingMembership) {
                  await storage.createGroupMembership({
                    groupId: group.id,
                    userId: entryInfo.userId,
                    role: "member",
                    status: "approved"
                  });
                }
              }
            } catch (groupError) {
              console.error("Error auto-joining group after payment:", groupError);
            }
          }
          
          try {
            await storage.createConnectionNotification({
              userId: entryInfo.userId,
              type: "competition_entry",
              eventId: eventRecord.id,
              metadata: JSON.stringify({ eventName: eventRecord.name, eventSlug: eventRecord.slug, eventId: eventRecord.id })
            });
          } catch (notifError) {
            console.error("Failed to create competition entry notification:", notifError);
          }
          
          console.log(`Event entry ${entry.id} created and payment confirmed for event ${eventId}`);
        }
      }

      if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
        console.log(`Received subscription event: ${event.type}`);
        const subscription = event.data?.object as any;
        const customerId = subscription?.customer;
        if (customerId) {
          const { prisma } = await import('./db');
          const user = await prisma.users.findFirst({ where: { stripeCustomerId: customerId } });
          if (user) {
            if (event.type === 'customer.subscription.deleted') {
              const defaultPlan = await prisma.subscriptionPlans.findFirst({ where: { isDefault: true } });
              await storage.updateUserStripeInfo(user.id, {
                stripeSubscriptionId: undefined,
                subscriptionEndDate: undefined,
                subscriptionPlanId: defaultPlan ? defaultPlan.id.toString() : undefined,
              });
              console.log(`User ${user.email} subscription deleted, reverted to default plan`);
            } else {
              const activePriceId = subscription.items?.data?.[0]?.price?.id;
              let matchedPlanId: string | undefined;
              if (activePriceId) {
                const allPlans = await prisma.subscriptionPlans.findMany({ where: { isActive: true } });
                const matchedPlan = allPlans.find((p: any) => p.stripePriceId === activePriceId);
                if (matchedPlan) {
                  matchedPlanId = matchedPlan.id.toString();
                }
              }
              await storage.updateUserStripeInfo(user.id, {
                stripeSubscriptionId: subscription.id,
                subscriptionEndDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : undefined,
                subscriptionPlanId: matchedPlanId,
              });
              console.log(`User ${user.email} subscription synced to plan ${matchedPlanId}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error processing webhook logic:', err);
    }
  }
}
