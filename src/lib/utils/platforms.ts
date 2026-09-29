// lib/data/platforms.ts
export interface CampaignPlatformData {
  value: string;
  label: string;
  category: 'ecommerce' | 'marketplace' | 'travel' | 'digital' | 'fintech' | 'gaming' | 'beauty' | 'food' | 'fashion' | 'general';
  region: 'global' | 'asia' | 'indonesia' | 'europe' | 'america';
  icon?: string;
  color?: string;
  isIndonesian?: boolean;
  affiliateNetwork?: string;
  commissionRange?: string;
  cookieDuration?: string;
}

export const PLATFORMS: CampaignPlatformData[] = [
  // ==================== E-COMMERCE GLOBAL ====================
  {
    value: 'amazon',
    label: 'Amazon',
    category: 'ecommerce',
    region: 'global',
    color: '#FF9900',
    affiliateNetwork: 'Amazon Associates',
    commissionRange: '1-10%',
    cookieDuration: '24 hours'
  },
  {
    value: 'ebay',
    label: 'eBay',
    category: 'ecommerce',
    region: 'global',
    color: '#E53238',
    affiliateNetwork: 'eBay Partner Network',
    commissionRange: '1-8%',
    cookieDuration: '24 hours'
  },
  {
    value: 'aliexpress',
    label: 'AliExpress',
    category: 'ecommerce',
    region: 'global',
    color: '#FF4747',
    affiliateNetwork: 'AliExpress Affiliate',
    commissionRange: '1-50%',
    cookieDuration: '30 days'
  },
  {
    value: 'walmart',
    label: 'Walmart',
    category: 'ecommerce',
    region: 'global',
    color: '#0071CE',
    affiliateNetwork: 'Walmart Affiliate',
    commissionRange: '1-4%',
    cookieDuration: '14 days'
  },
  {
    value: 'etsy',
    label: 'Etsy',
    category: 'ecommerce',
    region: 'global',
    color: '#F1641E',
    affiliateNetwork: 'Etsy Affiliate',
    commissionRange: '4-8%',
    cookieDuration: '30 days'
  },
  {
    value: 'shopify',
    label: 'Shopify',
    category: 'ecommerce',
    region: 'global',
    color: '#7AB55C',
    affiliateNetwork: 'Shopify Affiliate',
    commissionRange: '100-200% of first month',
    cookieDuration: '30 days'
  },

  // ==================== E-COMMERCE ASIA ====================
  {
    value: 'shopee',
    label: 'Shopee',
    category: 'ecommerce',
    region: 'asia',
    color: '#EE4D2D',
    isIndonesian: true,
    affiliateNetwork: 'Shopee Affiliate',
    commissionRange: '2-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'lazada',
    label: 'Lazada',
    category: 'ecommerce',
    region: 'asia',
    color: '#0F146D',
    isIndonesian: true,
    affiliateNetwork: 'Lazada Affiliate',
    commissionRange: '1-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'tokopedia',
    label: 'Tokopedia',
    category: 'ecommerce',
    region: 'asia',
    color: '#42B549',
    isIndonesian: true,
    affiliateNetwork: 'Tokopedia Affiliate',
    commissionRange: '1-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'bukalapak',
    label: 'Bukalapak',
    category: 'ecommerce',
    region: 'asia',
    color: '#E85A31',
    isIndonesian: true,
    affiliateNetwork: 'Bukalapak Mitra',
    commissionRange: '1-8%',
    cookieDuration: '30 days'
  },
  {
    value: 'blibli',
    label: 'Blibli',
    category: 'ecommerce',
    region: 'asia',
    color: '#1A3E6F',
    isIndonesian: true,
    affiliateNetwork: 'Blibli Affiliate',
    commissionRange: '1-8%',
    cookieDuration: '30 days'
  },
  {
    value: 'jd_id',
    label: 'JD.id',
    category: 'ecommerce',
    region: 'asia',
    color: '#E3212F',
    isIndonesian: true,
    affiliateNetwork: 'JD.id Affiliate',
    commissionRange: '1-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'temu',
    label: 'Temu',
    category: 'ecommerce',
    region: 'global',
    color: '#F44336',
    affiliateNetwork: 'Temu Affiliate',
    commissionRange: '5-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'shein',
    label: 'SHEIN',
    category: 'ecommerce',
    region: 'global',
    color: '#EA5599',
    affiliateNetwork: 'SHEIN Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'jd',
    label: 'JD.com',
    category: 'ecommerce',
    region: 'asia',
    color: '#E3212F',
    affiliateNetwork: 'JD Affiliate',
    commissionRange: '1-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'taobao',
    label: 'Taobao',
    category: 'ecommerce',
    region: 'asia',
    color: '#FF6A00',
    affiliateNetwork: 'Taobao Affiliate',
    commissionRange: '1-50%',
    cookieDuration: '15 days'
  },
  {
    value: 'tmall',
    label: 'Tmall',
    category: 'ecommerce',
    region: 'asia',
    color: '#FF6A00',
    affiliateNetwork: 'Tmall Affiliate',
    commissionRange: '1-30%',
    cookieDuration: '15 days'
  },
  {
    value: 'pinduoduo',
    label: 'Pinduoduo',
    category: 'ecommerce',
    region: 'asia',
    color: '#E1251B',
    affiliateNetwork: 'Pinduoduo Affiliate',
    commissionRange: '1-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'coupang',
    label: 'Coupang',
    category: 'ecommerce',
    region: 'asia',
    color: '#2266CC',
    affiliateNetwork: 'Coupang Partners',
    commissionRange: '1-10%',
    cookieDuration: '24 hours'
  },
  {
    value: 'rakuten',
    label: 'Rakuten',
    category: 'ecommerce',
    region: 'global',
    color: '#BF0000',
    affiliateNetwork: 'Rakuten Affiliate',
    commissionRange: '1-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'qoo10',
    label: 'Qoo10',
    category: 'ecommerce',
    region: 'asia',
    color: '#F03E0A',
    affiliateNetwork: 'Qoo10 Affiliate',
    commissionRange: '1-10%',
    cookieDuration: '30 days'
  },

  // ==================== E-COMMERCE INDONESIA LOKAL ====================
  {
    value: 'zalora',
    label: 'Zalora',
    category: 'fashion',
    region: 'asia',
    color: '#8E3A9B',
    isIndonesian: true,
    affiliateNetwork: 'Zalora Affiliate',
    commissionRange: '5-12%',
    cookieDuration: '30 days'
  },
  {
    value: 'sociolla',
    label: 'Sociolla',
    category: 'beauty',
    region: 'asia',
    color: '#E3217A',
    isIndonesian: true,
    affiliateNetwork: 'Sociolla Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'orami',
    label: 'Orami',
    category: 'ecommerce',
    region: 'asia',
    color: '#FF6B35',
    isIndonesian: true,
    affiliateNetwork: 'Orami Affiliate',
    commissionRange: '3-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'ruparupa',
    label: 'Ruparupa',
    category: 'ecommerce',
    region: 'asia',
    color: '#F37A22',
    isIndonesian: true,
    affiliateNetwork: 'Ruparupa Affiliate',
    commissionRange: '2-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'klikindomaret',
    label: 'Klik Indomaret',
    category: 'ecommerce',
    region: 'asia',
    color: '#E31E24',
    isIndonesian: true,
    affiliateNetwork: 'Klik Indomaret Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'happyfresh',
    label: 'HappyFresh',
    category: 'food',
    region: 'asia',
    color: '#00B578',
    isIndonesian: true,
    affiliateNetwork: 'HappyFresh Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'sayurbox',
    label: 'Sayurbox',
    category: 'food',
    region: 'asia',
    color: '#4CAF50',
    isIndonesian: true,
    affiliateNetwork: 'Sayurbox Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'mataharimall',
    label: 'MatahariMall',
    category: 'ecommerce',
    region: 'asia',
    color: '#F1592A',
    isIndonesian: true,
    affiliateNetwork: 'Matahari Affiliate',
    commissionRange: '2-8%',
    cookieDuration: '30 days'
  },

  // ==================== TRAVEL & HOSPITALITY ====================
  {
    value: 'traveloka',
    label: 'Traveloka',
    category: 'travel',
    region: 'asia',
    color: '#2E5B9E',
    isIndonesian: true,
    affiliateNetwork: 'Traveloka Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'tiket',
    label: 'Tiket.com',
    category: 'travel',
    region: 'asia',
    color: '#0088CC',
    isIndonesian: true,
    affiliateNetwork: 'Tiket Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'agoda',
    label: 'Agoda',
    category: 'travel',
    region: 'global',
    color: '#00A3D0',
    affiliateNetwork: 'Agoda Affiliate',
    commissionRange: '4-8%',
    cookieDuration: '30 days'
  },
  {
    value: 'booking',
    label: 'Booking.com',
    category: 'travel',
    region: 'global',
    color: '#003580',
    affiliateNetwork: 'Booking Affiliate',
    commissionRange: '25-40%',
    cookieDuration: '30 days'
  },
  {
    value: 'expedia',
    label: 'Expedia',
    category: 'travel',
    region: 'global',
    color: '#01A7E1',
    affiliateNetwork: 'Expedia Affiliate',
    commissionRange: '2-6%',
    cookieDuration: '30 days'
  },
  {
    value: 'airbnb',
    label: 'Airbnb',
    category: 'travel',
    region: 'global',
    color: '#FF5A5F',
    affiliateNetwork: 'Airbnb Affiliate',
    commissionRange: '25-30%',
    cookieDuration: '30 days'
  },
  {
    value: 'trivago',
    label: 'Trivago',
    category: 'travel',
    region: 'global',
    color: '#1F274A',
    affiliateNetwork: 'Trivago Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'kayak',
    label: 'Kayak',
    category: 'travel',
    region: 'global',
    color: '#01A7E1',
    affiliateNetwork: 'Kayak Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'skyscanner',
    label: 'Skyscanner',
    category: 'travel',
    region: 'global',
    color: '#0080B0',
    affiliateNetwork: 'Skyscanner Affiliate',
    commissionRange: '2-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'pegipegi',
    label: 'PegiPegi',
    category: 'travel',
    region: 'asia',
    color: '#00A651',
    isIndonesian: true,
    affiliateNetwork: 'PegiPegi Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },

  // ==================== DIGITAL SERVICES ====================
  {
    value: 'spotify',
    label: 'Spotify',
    category: 'digital',
    region: 'global',
    color: '#1ED760',
    affiliateNetwork: 'Spotify Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'netflix',
    label: 'Netflix',
    category: 'digital',
    region: 'global',
    color: '#E50914',
    affiliateNetwork: 'Netflix Affiliate',
    commissionRange: '10-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'disney',
    label: 'Disney+',
    category: 'digital',
    region: 'global',
    color: '#113CCF',
    affiliateNetwork: 'Disney Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'amazon_prime',
    label: 'Amazon Prime',
    category: 'digital',
    region: 'global',
    color: '#FF9900',
    affiliateNetwork: 'Amazon Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '24 hours'
  },
  {
    value: 'hbo',
    label: 'HBO Max',
    category: 'digital',
    region: 'global',
    color: '#5822B4',
    affiliateNetwork: 'HBO Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'paramount',
    label: 'Paramount+',
    category: 'digital',
    region: 'global',
    color: '#0066CC',
    affiliateNetwork: 'Paramount Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'apple_music',
    label: 'Apple Music',
    category: 'digital',
    region: 'global',
    color: '#FA233B',
    affiliateNetwork: 'Apple Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },

  // ==================== FINTECH & FINANCE ====================
  {
    value: 'gojek',
    label: 'Gojek',
    category: 'fintech',
    region: 'asia',
    color: '#00AA6C',
    isIndonesian: true,
    affiliateNetwork: 'Gojek Affiliate',
    commissionRange: '1-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'grab',
    label: 'Grab',
    category: 'fintech',
    region: 'asia',
    color: '#00B14F',
    isIndonesian: true,
    affiliateNetwork: 'Grab Affiliate',
    commissionRange: '1-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'ovo',
    label: 'OVO',
    category: 'fintech',
    region: 'asia',
    color: '#4B0082',
    isIndonesian: true,
    affiliateNetwork: 'OVO Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'dana',
    label: 'DANA',
    category: 'fintech',
    region: 'asia',
    color: '#0099FF',
    isIndonesian: true,
    affiliateNetwork: 'DANA Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'linkaja',
    label: 'LinkAja',
    category: 'fintech',
    region: 'asia',
    color: '#E31E24',
    isIndonesian: true,
    affiliateNetwork: 'LinkAja Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'shopee_pay',
    label: 'ShopeePay',
    category: 'fintech',
    region: 'asia',
    color: '#EE4D2D',
    isIndonesian: true,
    affiliateNetwork: 'Shopee Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'gopay',
    label: 'GoPay',
    category: 'fintech',
    region: 'asia',
    color: '#00AA6C',
    isIndonesian: true,
    affiliateNetwork: 'GoPay Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'paypal',
    label: 'PayPal',
    category: 'fintech',
    region: 'global',
    color: '#003087',
    affiliateNetwork: 'PayPal Affiliate',
    commissionRange: '10-30%',
    cookieDuration: '30 days'
  },
  {
    value: 'stripe',
    label: 'Stripe',
    category: 'fintech',
    region: 'global',
    color: '#635BFF',
    affiliateNetwork: 'Stripe Affiliate',
    commissionRange: '100-200% of first transaction',
    cookieDuration: '30 days'
  },
  {
    value: 'alipay',
    label: 'Alipay',
    category: 'fintech',
    region: 'asia',
    color: '#1677FF',
    affiliateNetwork: 'Alipay Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'wechat_pay',
    label: 'WeChat Pay',
    category: 'fintech',
    region: 'asia',
    color: '#09B83E',
    affiliateNetwork: 'WeChat Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },

  // ==================== GAMING & ENTERTAINMENT ====================
  {
    value: 'steam',
    label: 'Steam',
    category: 'gaming',
    region: 'global',
    color: '#171A21',
    affiliateNetwork: 'Steam Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'epic_games',
    label: 'Epic Games',
    category: 'gaming',
    region: 'global',
    color: '#313131',
    affiliateNetwork: 'Epic Games Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'playstation',
    label: 'PlayStation',
    category: 'gaming',
    region: 'global',
    color: '#003791',
    affiliateNetwork: 'PlayStation Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'xbox',
    label: 'Xbox',
    category: 'gaming',
    region: 'global',
    color: '#107C10',
    affiliateNetwork: 'Xbox Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'nintendo',
    label: 'Nintendo',
    category: 'gaming',
    region: 'global',
    color: '#E60012',
    affiliateNetwork: 'Nintendo Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'mobile_legends',
    label: 'Mobile Legends',
    category: 'gaming',
    region: 'asia',
    color: '#F25F22',
    isIndonesian: true,
    affiliateNetwork: 'Moonton Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'freefire',
    label: 'Free Fire',
    category: 'gaming',
    region: 'global',
    color: '#FF6100',
    affiliateNetwork: 'Garena Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'pubg',
    label: 'PUBG Mobile',
    category: 'gaming',
    region: 'global',
    color: '#FEBA00',
    affiliateNetwork: 'PUBG Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'valorant',
    label: 'Valorant',
    category: 'gaming',
    region: 'global',
    color: '#FD4556',
    affiliateNetwork: 'Riot Games Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'genshin_impact',
    label: 'Genshin Impact',
    category: 'gaming',
    region: 'global',
    color: '#0B4B8F',
    affiliateNetwork: 'HoYoverse Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },

  // ==================== BEAUTY & HEALTH ====================
  {
    value: 'beautynesia',
    label: 'Beautynesia',
    category: 'beauty',
    region: 'asia',
    color: '#FF6B8A',
    isIndonesian: true,
    affiliateNetwork: 'Beautynesia Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'makeover',
    label: 'Make Over',
    category: 'beauty',
    region: 'asia',
    color: '#E8217C',
    isIndonesian: true,
    affiliateNetwork: 'Make Over Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'wardah',
    label: 'Wardah',
    category: 'beauty',
    region: 'asia',
    color: '#4A2B1A',
    isIndonesian: true,
    affiliateNetwork: 'Wardah Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'mustika_ratu',
    label: 'Mustika Ratu',
    category: 'beauty',
    region: 'asia',
    color: '#D4AF37',
    isIndonesian: true,
    affiliateNetwork: 'Mustika Ratu Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'safi',
    label: 'Safi',
    category: 'beauty',
    region: 'asia',
    color: '#00843D',
    isIndonesian: true,
    affiliateNetwork: 'Safi Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'loreal',
    label: "L'Oréal",
    category: 'beauty',
    region: 'global',
    color: '#000000',
    affiliateNetwork: 'L\'Oréal Affiliate',
    commissionRange: '10-20%',
    cookieDuration: '30 days'
  },
  {
    value: 'watsons',
    label: 'Watsons',
    category: 'beauty',
    region: 'asia',
    color: '#009540',
    isIndonesian: true,
    affiliateNetwork: 'Watsons Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'guardian',
    label: 'Guardian',
    category: 'beauty',
    region: 'asia',
    color: '#E31E24',
    isIndonesian: true,
    affiliateNetwork: 'Guardian Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },

  // ==================== FOOD DELIVERY ====================
  {
    value: 'gofood',
    label: 'GoFood',
    category: 'food',
    region: 'asia',
    color: '#00AA6C',
    isIndonesian: true,
    affiliateNetwork: 'GoFood Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'grabfood',
    label: 'GrabFood',
    category: 'food',
    region: 'asia',
    color: '#00B14F',
    isIndonesian: true,
    affiliateNetwork: 'GrabFood Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'shopee_food',
    label: 'ShopeeFood',
    category: 'food',
    region: 'asia',
    color: '#EE4D2D',
    isIndonesian: true,
    affiliateNetwork: 'Shopee Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'deliveroo',
    label: 'Deliveroo',
    category: 'food',
    region: 'global',
    color: '#00C2B1',
    affiliateNetwork: 'Deliveroo Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'ubereats',
    label: 'UberEats',
    category: 'food',
    region: 'global',
    color: '#06C167',
    affiliateNetwork: 'UberEats Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'doordash',
    label: 'DoorDash',
    category: 'food',
    region: 'global',
    color: '#FF3008',
    affiliateNetwork: 'DoorDash Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'zomato',
    label: 'Zomato',
    category: 'food',
    region: 'global',
    color: '#CB202D',
    affiliateNetwork: 'Zomato Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'foodpanda',
    label: 'Foodpanda',
    category: 'food',
    region: 'asia',
    color: '#D70F64',
    isIndonesian: true,
    affiliateNetwork: 'Foodpanda Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },
  {
    value: 'swiggy',
    label: 'Swiggy',
    category: 'food',
    region: 'asia',
    color: '#FC8019',
    affiliateNetwork: 'Swiggy Affiliate',
    commissionRange: '5-15%',
    cookieDuration: '30 days'
  },

  // ==================== FASHION & RETAIL ====================
  {
    value: 'h&m',
    label: 'H&M',
    category: 'fashion',
    region: 'global',
    color: '#E50010',
    affiliateNetwork: 'H&M Affiliate',
    commissionRange: '5-12%',
    cookieDuration: '30 days'
  },
  {
    value: 'zara',
    label: 'Zara',
    category: 'fashion',
    region: 'global',
    color: '#000000',
    affiliateNetwork: 'Zara Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'uniqlo',
    label: 'Uniqlo',
    category: 'fashion',
    region: 'global',
    color: '#F20000',
    affiliateNetwork: 'Uniqlo Affiliate',
    commissionRange: '5-10%',
    cookieDuration: '30 days'
  },

  // ==================== MARKETPLACE LAINNYA ====================
  {
    value: 'carousell',
    label: 'Carousell',
    category: 'marketplace',
    region: 'asia',
    color: '#C1282D',
    isIndonesian: true,
    affiliateNetwork: 'Carousell Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'olx',
    label: 'OLX',
    category: 'marketplace',
    region: 'global',
    color: '#00A000',
    isIndonesian: true,
    affiliateNetwork: 'OLX Affiliate',
    commissionRange: '1-5%',
    cookieDuration: '30 days'
  },
  {
    value: 'fabelio',
    label: 'Fabelio',
    category: 'ecommerce',
    region: 'asia',
    color: '#F15A29',
    isIndonesian: true,
    affiliateNetwork: 'Fabelio Affiliate',
    commissionRange: '3-10%',
    cookieDuration: '30 days'
  },
  {
    value: 'ishop',
    label: 'iShop',
    category: 'ecommerce',
    region: 'asia',
    color: '#E31E24',
    isIndonesian: true,
    affiliateNetwork: 'iShop Affiliate',
    commissionRange: '2-8%',
    cookieDuration: '30 days'
  },
  {
    value: 'matahari',
    label: 'Matahari',
    category: 'fashion',
    region: 'asia',
    color: '#F1592A',
    isIndonesian: true,
    affiliateNetwork: 'Matahari Affiliate',
    commissionRange: '2-8%',
    cookieDuration: '30 days'
  },
  {
    value: 'ace_hardware',
    label: 'Ace Hardware',
    category: 'ecommerce',
    region: 'asia',
    color: '#E31E24',
    isIndonesian: true,
    affiliateNetwork: 'Ace Hardware Affiliate',
    commissionRange: '2-8%',
    cookieDuration: '30 days'
  },
  {
    value: 'informa',
    label: 'Informa',
    category: 'ecommerce',
    region: 'asia',
    color: '#F15A29',
    isIndonesian: true,
    affiliateNetwork: 'Informa Affiliate',
    commissionRange: '2-8%',
    cookieDuration: '30 days'
  }
];

// Helper functions
export function getPlatformByValue(value: string): CampaignPlatformData | undefined {
  return PLATFORMS.find(p => p.value === value);
}

export function getPlatformsByCategory(category: string): CampaignPlatformData[] {
  return PLATFORMS.filter(p => p.category === category);
}

export function getIndonesianPlatforms(): CampaignPlatformData[] {
  return PLATFORMS.filter(p => p.isIndonesian);
}

export function getPlatformsByRegion(region: string): CampaignPlatformData[] {
  return PLATFORMS.filter(p => p.region === region);
}

export function getPlatformOptions(): Array<{ value: string; label: string }> {
  return PLATFORMS.map(p => ({ value: p.value, label: p.label }));
}

export function getPlatformOptionsGrouped(): Array<{
  label: string;
  options: Array<{ value: string; label: string }>;
}> {
  const categories = [
    { key: 'ecommerce', label: '🛒 E-Commerce' },
    { key: 'marketplace', label: '🏪 Marketplace' },
    { key: 'fashion', label: '👗 Fashion' },
    { key: 'beauty', label: '💄 Beauty & Health' },
    { key: 'travel', label: '✈️ Travel & Hospitality' },
    { key: 'digital', label: '🎬 Digital Services' },
    { key: 'fintech', label: '💰 Fintech & Finance' },
    { key: 'gaming', label: '🎮 Gaming & Entertainment' },
    { key: 'food', label: '🍔 Food Delivery' },
    { key: 'general', label: '🌐 General' }
  ];

  return categories.map(cat => ({
    label: cat.label,
    options: PLATFORMS
      .filter(p => p.category === cat.key)
      .map(p => ({ value: p.value, label: p.label }))
  })).filter(group => group.options.length > 0);
}