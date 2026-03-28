import { getUncachableStripeClient } from '../stripeClient';

async function seedStripeProducts() {
  console.log('Connecting to Stripe via Replit connection...');
  const stripe = await getUncachableStripeClient();

  const products = [
    {
      name: 'Freemium',
      description: 'Free to use platform but with limited features',
      metadata: { tier: 'freemium' },
      price: 0,
      interval: 'month' as const
    },
    {
      name: 'Silver',
      description: 'Advanced features with community access',
      metadata: { tier: 'silver' },
      price: 999, // £9.99
      interval: 'month' as const
    },
    {
      name: 'Gold',
      description: 'Full access to all platform features',
      metadata: { tier: 'gold' },
      price: 1499, // £14.99
      interval: 'month' as const
    }
  ];

  console.log('Creating Stripe products and prices...');

  for (const productData of products) {
    try {
      const existingProducts = await stripe.products.list({
        active: true,
        limit: 100
      });

      const existing = existingProducts.data.find(p => p.name === productData.name);
      
      if (existing) {
        console.log(`Product "${productData.name}" already exists (${existing.id})`);
        continue;
      }

      const product = await stripe.products.create({
        name: productData.name,
        description: productData.description,
        metadata: productData.metadata
      });

      console.log(`Created product: ${product.name} (${product.id})`);

      if (productData.price > 0) {
        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: productData.price,
          currency: 'gbp',
          recurring: { interval: productData.interval }
        });
        console.log(`  Created price: £${productData.price / 100}/${productData.interval} (${price.id})`);
      }
    } catch (error) {
      console.error(`Error creating product "${productData.name}":`, error);
    }
  }

  console.log('Done seeding Stripe products!');
  process.exit(0);
}

seedStripeProducts().catch(err => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
