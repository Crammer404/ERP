export const pricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    period: 'month',
    description: 'Perfect for small businesses getting started',
    features: [
      'Up to 5 users',
      'Basic inventory management',
      'Point of sale system',
      'Email support',
      'Basic reporting'
    ],
    popular: false,
    isCustom: false
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 79,
    period: 'month',
    description: 'Ideal for growing businesses',
    features: [
      'Up to 25 users',
      'Advanced inventory management',
      'Multi-location support',
      'Advanced analytics',
      'Priority support',
      'API access',
      'Custom integrations'
    ],
    popular: true,
    isCustom: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 199,
    period: 'month',
    description: 'For large organizations',
    features: [
      'Unlimited users',
      'Full ERP suite',
      'Multi-tenant support',
      'Advanced security',
      '24/7 phone support',
      'Custom development',
      'Dedicated account manager'
    ],
    popular: false,
    isCustom: false
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null,
    period: null,
    description: 'Tailored solutions for your unique needs',
    features: [
      'Everything in Enterprise',
      'Custom integrations',
      'Dedicated infrastructure',
      'SLA guarantees',
      'White-label options',
      'Custom training',
      'Priority roadmap access'
    ],
    popular: false,
    isCustom: true
  }
];
