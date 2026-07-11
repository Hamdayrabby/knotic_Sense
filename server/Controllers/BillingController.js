const Subscription = require('../Models/Subscription');
let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create Stripe or Mock Checkout Session
 */
const createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body; // 'pro' or 'teams'
    if (!['pro', 'teams'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan selection' });
    }

    const priceIds = {
      pro: process.env.STRIPE_PRICE_PRO || 'price_mock_pro',
      teams: process.env.STRIPE_PRICE_TEAMS || 'price_mock_teams'
    };

    // If Stripe is not configured, run in Developer Mock Mode
    if (!stripe) {
      console.log(`[Billing] Stripe not configured. Running mock checkout for plan: ${plan}`);
      
      // Upgrade subscription to selected plan
      const sub = await Subscription.findOneAndUpdate(
        { user: req.user.id },
        { 
          plan,
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        { new: true, upsert: true }
      );

      return res.status(200).json({
        success: true,
        message: 'Running in development mock checkout mode. Plan upgraded successfully!',
        data: {
          sessionUrl: '/settings?upgraded=true',
          mocked: true,
          plan: sub.plan
        }
      });
    }

    // Official Stripe checkout session creation
    let sub = await Subscription.findOne({ user: req.user.id });
    let stripeCustomerId = sub?.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user.id.toString() }
      });
      stripeCustomerId = customer.id;
      
      if (sub) {
        sub.stripeCustomerId = stripeCustomerId;
        await sub.save();
      } else {
        sub = await Subscription.create({ user: req.user.id, stripeCustomerId });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceIds[plan],
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?payment=cancelled`,
      metadata: {
        userId: req.user.id.toString(),
        plan
      }
    });

    res.status(200).json({
      success: true,
      data: {
        sessionUrl: session.url,
        mocked: false
      }
    });

  } catch (error) {
    console.error('Create Checkout Session Error:', error);
    res.status(500).json({ success: false, message: 'Billing server error' });
  }
};

/**
 * Access Customer Billing Portal
 */
const createPortalSession = async (req, res) => {
  try {
    const sub = await Subscription.findOne({ user: req.user.id });

    if (!stripe || !sub?.stripeCustomerId) {
      return res.status(200).json({
        success: true,
        message: 'No active Stripe session found. Return to local billing.',
        data: { portalUrl: '/settings' }
      });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings`
    });

    res.status(200).json({
      success: true,
      data: { portalUrl: session.url }
    });

  } catch (error) {
    console.error('Create Portal Session Error:', error);
    res.status(500).json({ success: false, message: 'Billing portal error' });
  }
};

/**
 * Stripe Webhooks Handler
 */
const handleWebhook = async (req, res) => {
  if (!stripe) {
    return res.status(400).send('Webhook Endpoint: Stripe not configured');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const session = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const subId = session.subscription;
        const customerId = session.customer;
        const userId = session.metadata.userId;
        const plan = session.metadata.plan;

        const stripeSubscription = await stripe.subscriptions.retrieve(subId);

        await Subscription.findOneAndUpdate(
          { user: userId },
          {
            stripeCustomerId: customerId,
            stripeSubscriptionId: subId,
            plan: plan || 'pro',
            status: 'active',
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
          },
          { new: true, upsert: true }
        );
        break;
      }
      case 'invoice.payment_succeeded': {
        const subId = session.subscription;
        if (subId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(subId);
          await Subscription.findOneAndUpdate(
            { stripeSubscriptionId: subId },
            {
              status: 'active',
              currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000)
            }
          );
        }
        break;
      }
      case 'customer.subscription.deleted':
      case 'customer.subscription.updated': {
        const subId = session.id;
        const status = session.status;
        const cancelAtPeriodEnd = session.cancel_at_period_end;
        
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId: subId },
          {
            status: status === 'active' ? 'active' : 'canceled',
            cancelAtPeriodEnd,
            currentPeriodEnd: new Date(session.current_period_end * 1000)
          }
        );
        break;
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Error handling webhook event:', err);
    res.status(500).send('Webhook handler error');
  }
};

module.exports = {
  createCheckoutSession,
  createPortalSession,
  handleWebhook
};
