import { getUncachableStripeClient } from './stripeClient';
import { prisma } from './db';
import { Prisma } from '@prisma/client';

export class StripeService {
  async createCustomer(email: string, userId: string, name?: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.customers.create({
      email,
      name,
      metadata: { userId },
    });
  }

  async createCheckoutSession(
    customerId: string, 
    priceId: string, 
    successUrl: string, 
    cancelUrl: string,
    mode: 'subscription' | 'payment' = 'subscription'
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });
  }

  async createSubscriptionChangeSession(
    customerId: string,
    newPriceId: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const stripe = await getUncachableStripeClient();
    
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId,
        }],
        proration_behavior: 'create_prorations',
      });
      return { subscription: updatedSubscription, type: 'update' };
    }

    const session = await this.createCheckoutSession(customerId, newPriceId, successUrl, cancelUrl);
    return { session, type: 'checkout' };
  }

  async cancelSubscription(subscriptionId: string, cancelAtPeriodEnd: boolean = true) {
    const stripe = await getUncachableStripeClient();
    
    if (cancelAtPeriodEnd) {
      return await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });
    }
    
    return await stripe.subscriptions.cancel(subscriptionId);
  }

  async reactivateSubscription(subscriptionId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
  }

  async createCustomerPortalSession(customerId: string, returnUrl: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });
  }

  async getCustomerSubscriptions(customerId: string) {
    const stripe = await getUncachableStripeClient();
    return await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
    });
  }

  async getProduct(productId: string) {
    const result: any[] = await prisma.$queryRaw(
      Prisma.sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result[0] || null;
  }

  async getSubscription(subscriptionId: string) {
    const result: any[] = await prisma.$queryRaw(
      Prisma.sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result[0] || null;
  }

  async listProducts(active = true) {
    const result: any[] = await prisma.$queryRaw(
      Prisma.sql`SELECT * FROM stripe.products WHERE active = ${active} ORDER BY name`
    );
    return result;
  }

  async listProductsWithPrices(active = true) {
    const result: any[] = await prisma.$queryRaw(
      Prisma.sql`
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM stripe.products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        WHERE p.active = ${active}
        ORDER BY p.name, pr.unit_amount
      `
    );
    return result;
  }

  async listProductsWithPricesFromApi() {
    const stripe = await getUncachableStripeClient();
    const products = await stripe.products.list({ active: true, limit: 100 });
    const prices = await stripe.prices.list({ active: true, limit: 100 });
    
    const pricesByProduct = new Map<string, any[]>();
    for (const price of prices.data) {
      const productId = typeof price.product === 'string' ? price.product : price.product.id;
      if (!pricesByProduct.has(productId)) {
        pricesByProduct.set(productId, []);
      }
      pricesByProduct.get(productId)!.push({
        price_id: price.id,
        unit_amount: price.unit_amount,
        currency: price.currency,
        recurring: price.recurring,
        price_active: price.active,
        price_metadata: price.metadata,
      });
    }
    
    const rows: any[] = [];
    for (const product of products.data) {
      const productPrices = pricesByProduct.get(product.id) || [];
      if (productPrices.length === 0) {
        rows.push({
          product_id: product.id,
          product_name: product.name,
          product_description: product.description,
          product_active: product.active,
          product_metadata: product.metadata,
          price_id: null,
          unit_amount: null,
          currency: null,
          recurring: null,
          price_active: null,
          price_metadata: null,
        });
      } else {
        for (const price of productPrices) {
          rows.push({
            product_id: product.id,
            product_name: product.name,
            product_description: product.description,
            product_active: product.active,
            product_metadata: product.metadata,
            ...price,
          });
        }
      }
    }
    
    return rows;
  }

  async listPrices(active = true) {
    const result: any[] = await prisma.$queryRaw(
      Prisma.sql`SELECT * FROM stripe.prices WHERE active = ${active}`
    );
    return result;
  }

  async createEventProduct(eventName: string, eventId: string, entryFeeInPence: number, currency: string = 'gbp') {
    const stripe = await getUncachableStripeClient();
    
    // Create the product
    const product = await stripe.products.create({
      name: eventName,
      metadata: {
        eventId,
        type: 'event_entry'
      }
    });

    // Create the price (one-time payment for event entry)
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: entryFeeInPence,
      currency,
      metadata: {
        eventId,
        type: 'event_entry'
      }
    });

    return { product, price };
  }

  async updateEventProduct(stripeProductId: string, eventName: string, entryFeeInPence: number, currency: string = 'gbp') {
    const stripe = await getUncachableStripeClient();
    
    // Update the product name
    await stripe.products.update(stripeProductId, {
      name: eventName
    });

    // Create a new price (Stripe prices are immutable, so we create a new one)
    const price = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: entryFeeInPence,
      currency,
      metadata: {
        type: 'event_entry'
      }
    });

    return { price };
  }

  async archiveEventProduct(stripeProductId: string) {
    const stripe = await getUncachableStripeClient();
    
    // Archive the product (don't delete, just deactivate)
    await stripe.products.update(stripeProductId, {
      active: false
    });
  }

  async createEventEntryCheckout(
    customerId: string,
    stripePriceId: string,
    eventId: string,
    eventName: string,
    quantity: number,
    entryData: string,
    successUrl: string,
    cancelUrl: string
  ) {
    const stripe = await getUncachableStripeClient();
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: stripePriceId, quantity }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        eventId,
        stripePriceId,
        entryData,
        type: 'event_entry'
      },
      payment_intent_data: {
        metadata: {
          eventId,
          eventName,
          type: 'event_entry'
        }
      }
    });
  }
}

export const stripeService = new StripeService();
