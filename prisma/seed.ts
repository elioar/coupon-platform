import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create categories
  console.log('📁 Creating categories...')
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: {
        nameEn: 'Electronics',
        nameEl: 'Ηλεκτρονικά',
        slug: 'electronics',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: {
        nameEn: 'Fashion',
        nameEl: 'Μόδα',
        slug: 'fashion',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'food' },
      update: {},
      create: {
        nameEn: 'Food & Dining',
        nameEl: 'Φαγητό & Εστιατόρια',
        slug: 'food',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'travel' },
      update: {},
      create: {
        nameEn: 'Travel',
        nameEl: 'Ταξίδια',
        slug: 'travel',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'beauty' },
      update: {},
      create: {
        nameEn: 'Beauty & Health',
        nameEl: 'Ομορφιά & Υγεία',
        slug: 'beauty',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'home' },
      update: {},
      create: {
        nameEn: 'Home & Garden',
        nameEl: 'Σπίτι & Κήπος',
        slug: 'home',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: {
        nameEn: 'Sports & Fitness',
        nameEl: 'Αθλητισμός & Γυμναστική',
        slug: 'sports',
      },
    }),
    prisma.category.upsert({
      where: { slug: 'entertainment' },
      update: {},
      create: {
        nameEn: 'Entertainment',
        nameEl: 'Ψυχαγωγία',
        slug: 'entertainment',
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vibepeek.com' },
    update: {},
    create: {
      email: 'admin@vibepeek.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created (email: admin@vibepeek.com, password: admin123)')

  // Create business users
  console.log('🏢 Creating business users...')
  const businessPassword = await bcrypt.hash('business123', 10)
  
  const businesses = await Promise.all([
    // TechStore - Electronics
    prisma.user.upsert({
      where: { email: 'techstore@example.com' },
      update: {
        phone: '+30 210 1234567',
        address: '123 Tech Avenue',
        businessDescription: JSON.stringify({
          raw: 'TechStore is Athens\' premier electronics retailer, offering the latest in technology from smartphones to laptops, gaming equipment, and smart home devices. We provide expert advice and exceptional customer service.',
          vatNumber: '123456789',
          city: 'Athens',
          postalCode: '10431'
        }),
        businessCategories: [categories[0].id], // Electronics
        businessLocation: 'Athens, Greece',
        businessWebsite: 'https://www.techstore.gr',
        businessInstagram: 'https://instagram.com/techstore_gr',
        businessFacebook: 'https://facebook.com/techstoregr',
        businessTikTok: 'https://tiktok.com/@techstore_gr',
      },
      create: {
        email: 'techstore@example.com',
        password: businessPassword,
        name: 'TechStore',
        role: 'BUSINESS',
        phone: '+30 210 1234567',
        address: '123 Tech Avenue',
        businessDescription: JSON.stringify({
          raw: 'TechStore is Athens\' premier electronics retailer, offering the latest in technology from smartphones to laptops, gaming equipment, and smart home devices. We provide expert advice and exceptional customer service.',
          vatNumber: '123456789',
          city: 'Athens',
          postalCode: '10431'
        }),
        businessCategories: [categories[0].id], // Electronics
        businessLocation: 'Athens, Greece',
        businessWebsite: 'https://www.techstore.gr',
        businessInstagram: 'https://instagram.com/techstore_gr',
        businessFacebook: 'https://facebook.com/techstoregr',
        businessTikTok: 'https://tiktok.com/@techstore_gr',
      },
    }),
    // Fashion Hub - Fashion
    prisma.user.upsert({
      where: { email: 'fashionhub@example.com' },
      update: {
        phone: '+30 210 2345678',
        address: '456 Fashion Street',
        businessDescription: JSON.stringify({
          raw: 'Fashion Hub is a trendy boutique offering the latest fashion trends for men and women. From designer clothing to accessories, we bring you style and quality at affordable prices.',
          vatNumber: '234567890',
          city: 'Thessaloniki',
          postalCode: '54625'
        }),
        businessCategories: [categories[1].id], // Fashion
        businessLocation: 'Thessaloniki, Greece',
        businessWebsite: 'https://www.fashionhub.gr',
        businessInstagram: 'https://instagram.com/fashionhub_gr',
        businessFacebook: 'https://facebook.com/fashionhubgr',
        businessTikTok: 'https://tiktok.com/@fashionhub_gr',
      },
      create: {
        email: 'fashionhub@example.com',
        password: businessPassword,
        name: 'Fashion Hub',
        role: 'BUSINESS',
        phone: '+30 210 2345678',
        address: '456 Fashion Street',
        businessDescription: JSON.stringify({
          raw: 'Fashion Hub is a trendy boutique offering the latest fashion trends for men and women. From designer clothing to accessories, we bring you style and quality at affordable prices.',
          vatNumber: '234567890',
          city: 'Thessaloniki',
          postalCode: '54625'
        }),
        businessCategories: [categories[1].id], // Fashion
        businessLocation: 'Thessaloniki, Greece',
        businessWebsite: 'https://www.fashionhub.gr',
        businessInstagram: 'https://instagram.com/fashionhub_gr',
        businessFacebook: 'https://facebook.com/fashionhubgr',
        businessTikTok: 'https://tiktok.com/@fashionhub_gr',
      },
    }),
    // Food Corner - Food & Dining
    prisma.user.upsert({
      where: { email: 'foodcorner@example.com' },
      update: {
        phone: '+30 210 3456789',
        address: '789 Culinary Boulevard',
        businessDescription: JSON.stringify({
          raw: 'Food Corner is a family-owned restaurant serving authentic Greek cuisine with a modern twist. We use fresh, locally sourced ingredients to create delicious meals in a warm and welcoming atmosphere.',
          vatNumber: '345678901',
          city: 'Athens',
          postalCode: '10678'
        }),
        businessCategories: [categories[2].id], // Food & Dining
        businessLocation: 'Athens, Greece',
        businessWebsite: 'https://www.foodcorner.gr',
        businessInstagram: 'https://instagram.com/foodcorner_gr',
        businessFacebook: 'https://facebook.com/foodcornergr',
        businessTikTok: 'https://tiktok.com/@foodcorner_gr',
      },
      create: {
        email: 'foodcorner@example.com',
        password: businessPassword,
        name: 'Food Corner',
        role: 'BUSINESS',
        phone: '+30 210 3456789',
        address: '789 Culinary Boulevard',
        businessDescription: JSON.stringify({
          raw: 'Food Corner is a family-owned restaurant serving authentic Greek cuisine with a modern twist. We use fresh, locally sourced ingredients to create delicious meals in a warm and welcoming atmosphere.',
          vatNumber: '345678901',
          city: 'Athens',
          postalCode: '10678'
        }),
        businessCategories: [categories[2].id], // Food & Dining
        businessLocation: 'Athens, Greece',
        businessWebsite: 'https://www.foodcorner.gr',
        businessInstagram: 'https://instagram.com/foodcorner_gr',
        businessFacebook: 'https://facebook.com/foodcornergr',
        businessTikTok: 'https://tiktok.com/@foodcorner_gr',
      },
    }),
    // Travel Pro - Travel
    prisma.user.upsert({
      where: { email: 'travelpro@example.com' },
      update: {
        phone: '+30 210 4567890',
        address: '321 Travel Plaza',
        businessDescription: JSON.stringify({
          raw: 'Travel Pro is your trusted travel agency specializing in customized vacation packages, hotel bookings, and flight reservations. We make your dream destinations accessible with unbeatable deals and expert travel planning.',
          vatNumber: '456789012',
          city: 'Athens',
          postalCode: '11521'
        }),
        businessCategories: [categories[3].id], // Travel
        businessLocation: 'Athens, Greece',
        businessWebsite: 'https://www.travelpro.gr',
        businessInstagram: 'https://instagram.com/travelpro_gr',
        businessFacebook: 'https://facebook.com/travelprogr',
        businessTikTok: 'https://tiktok.com/@travelpro_gr',
      },
      create: {
        email: 'travelpro@example.com',
        password: businessPassword,
        name: 'Travel Pro',
        role: 'BUSINESS',
        phone: '+30 210 4567890',
        address: '321 Travel Plaza',
        businessDescription: JSON.stringify({
          raw: 'Travel Pro is your trusted travel agency specializing in customized vacation packages, hotel bookings, and flight reservations. We make your dream destinations accessible with unbeatable deals and expert travel planning.',
          vatNumber: '456789012',
          city: 'Athens',
          postalCode: '11521'
        }),
        businessCategories: [categories[3].id], // Travel
        businessLocation: 'Athens, Greece',
        businessWebsite: 'https://www.travelpro.gr',
        businessInstagram: 'https://instagram.com/travelpro_gr',
        businessFacebook: 'https://facebook.com/travelprogr',
        businessTikTok: 'https://tiktok.com/@travelpro_gr',
      },
    }),
  ])

  console.log(`✅ Created ${businesses.length} business users (password: business123)`)

  // Delete existing coupons to avoid duplicates
  console.log('🗑️  Cleaning existing coupons...')
  await prisma.coupon.deleteMany({})
  console.log('✅ Existing coupons deleted')

  // Create sample coupons
  console.log('🎫 Creating sample coupons...')
  
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)
  
  const sixtyDaysFromNow = new Date()
  sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60)
  
  const ninetyDaysFromNow = new Date()
  ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90)

  const coupons = await Promise.all([
    // Electronics coupons
    prisma.coupon.create({
      data: {
        title: '50% OFF on All Laptops',
        description: 'Get an amazing 50% discount on all laptop models. Latest brands including Apple, Dell, HP, and Lenovo. Limited time offer!',
        code: 'LAPTOP50',
        imagePath: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=600&fit=crop',
        businessId: businesses[0].id,
        categoryId: categories[0].id,
        discountPercentage: 50,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '30% OFF Smartphones',
        description: 'Upgrade to the latest smartphone with 30% off. All major brands available including iPhone, Samsung, and Google Pixel.',
        code: 'PHONE30',
        imagePath: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=600&fit=crop',
        businessId: businesses[0].id,
        categoryId: categories[0].id,
        discountPercentage: 30,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '20% OFF Gaming Accessories',
        description: 'Level up your gaming setup! Get 20% off on keyboards, mice, headsets, and more gaming accessories.',
        code: 'GAME20',
        imagePath: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop',
        businessId: businesses[0].id,
        categoryId: categories[0].id,
        discountPercentage: 20,
        expirationDate: thirtyDaysFromNow,
        status: 'PENDING',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '40% OFF Smart Watches',
        description: 'Stay connected with style! Get 40% off on premium smartwatches. Track your fitness, receive notifications, and more.',
        code: 'WATCH40',
        imagePath: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=600&fit=crop',
        businessId: businesses[0].id,
        categoryId: categories[0].id,
        discountPercentage: 40,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '25% OFF Headphones & Audio',
        description: 'Experience premium sound quality! 25% discount on all headphones, earbuds, and audio equipment.',
        code: 'AUDIO25',
        imagePath: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=600&fit=crop',
        businessId: businesses[0].id,
        categoryId: categories[0].id,
        discountPercentage: 25,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Fashion coupons
    prisma.coupon.create({
      data: {
        title: 'Summer Sale - 40% OFF',
        description: 'Refresh your wardrobe with our summer collection! 40% discount on all clothing items. Limited stock available.',
        code: 'SUMMER40',
        imagePath: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop',
        businessId: businesses[1].id,
        categoryId: categories[1].id,
        discountPercentage: 40,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '25% OFF Designer Shoes',
        description: 'Step in style with 25% off on designer shoes. Premium brands at unbeatable prices. All sizes available.',
        code: 'SHOES25',
        imagePath: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=600&fit=crop',
        businessId: businesses[1].id,
        categoryId: categories[1].id,
        discountPercentage: 25,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: 'Buy 2 Get 1 Free - Accessories',
        description: 'Amazing deal on fashion accessories! Buy any 2 items and get 1 free. Valid on bags, belts, and jewelry.',
        code: 'ACC3FOR2',
        imagePath: 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=600&fit=crop',
        businessId: businesses[1].id,
        categoryId: categories[1].id,
        discountPercentage: 33,
        expirationDate: thirtyDaysFromNow,
        status: 'REJECTED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '35% OFF Winter Collection',
        description: 'Stay warm and stylish! 35% discount on our winter collection including coats, sweaters, and jackets.',
        code: 'WINTER35',
        imagePath: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop',
        businessId: businesses[1].id,
        categoryId: categories[1].id,
        discountPercentage: 35,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Food coupons
    prisma.coupon.create({
      data: {
        title: '15% OFF All Orders',
        description: 'Enjoy delicious meals with 15% discount on all menu items. Order online or dine-in. Valid for all locations.',
        code: 'FOOD15',
        imagePath: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
        businessId: businesses[2].id,
        categoryId: categories[2].id,
        discountPercentage: 15,
        expirationDate: thirtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: 'Free Dessert with Any Main Course',
        description: 'Treat yourself! Get a complimentary dessert when you order any main course. Choose from our premium dessert menu.',
        code: 'DESSERT2024',
        imagePath: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&h=600&fit=crop',
        businessId: businesses[2].id,
        categoryId: categories[2].id,
        discountPercentage: 20,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '20% OFF Weekend Brunch',
        description: 'Start your weekend right! Enjoy 20% off on our weekend brunch menu. Available Saturdays and Sundays 10 AM - 2 PM.',
        code: 'BRUNCH20',
        imagePath: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&h=600&fit=crop',
        businessId: businesses[2].id,
        categoryId: categories[2].id,
        discountPercentage: 20,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '30% OFF Family Meals',
        description: 'Feed the whole family! Get 30% off on family meal packages. Perfect for gatherings and special occasions.',
        code: 'FAMILY30',
        imagePath: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop',
        businessId: businesses[2].id,
        categoryId: categories[2].id,
        discountPercentage: 30,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Travel coupons
    prisma.coupon.create({
      data: {
        title: '35% OFF Hotel Bookings',
        description: 'Plan your dream vacation! Save 35% on hotel bookings worldwide. Luxury hotels at amazing prices.',
        code: 'HOTEL35',
        imagePath: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=600&fit=crop',
        businessId: businesses[3].id,
        categoryId: categories[3].id,
        discountPercentage: 35,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '€100 OFF Flight Tickets',
        description: 'Fly for less! Get €100 discount on international flight bookings. Book now and save big on your next trip.',
        code: 'FLY100',
        imagePath: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800&h=600&fit=crop',
        businessId: businesses[3].id,
        categoryId: categories[3].id,
        discountPercentage: 25,
        expirationDate: sixtyDaysFromNow,
        status: 'PENDING',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '40% OFF Vacation Packages',
        description: 'All-inclusive vacation packages at unbeatable prices! Save 40% on complete travel packages including flights, hotels, and activities.',
        code: 'VACATION40',
        imagePath: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop',
        businessId: businesses[3].id,
        categoryId: categories[3].id,
        discountPercentage: 40,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '25% OFF Car Rentals',
        description: 'Explore at your own pace! Get 25% off on car rentals. Available for daily, weekly, and monthly rentals.',
        code: 'CAR25',
        imagePath: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop',
        businessId: businesses[3].id,
        categoryId: categories[3].id,
        discountPercentage: 25,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Beauty coupons
    prisma.coupon.create({
      data: {
        title: '30% OFF Beauty Products',
        description: 'Glow up with 30% off on all beauty and skincare products. Premium brands at incredible prices.',
        code: 'BEAUTY30',
        imagePath: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=600&fit=crop',
        businessId: businesses[1].id,
        categoryId: categories[4].id,
        discountPercentage: 30,
        expirationDate: thirtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '50% OFF Spa Treatments',
        description: 'Relax and rejuvenate! Get 50% off on all spa treatments including massages, facials, and body treatments.',
        code: 'SPA50',
        imagePath: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&h=600&fit=crop',
        businessId: businesses[1].id,
        categoryId: categories[4].id,
        discountPercentage: 50,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Home coupons
    prisma.coupon.create({
      data: {
        title: '45% OFF Home Decor',
        description: 'Transform your space! Get 45% discount on home decor items. Furniture, lighting, and accessories included.',
        code: 'HOME45',
        imagePath: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=600&fit=crop',
        businessId: businesses[0].id,
        categoryId: categories[5].id,
        discountPercentage: 45,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '30% OFF Kitchen Appliances',
        description: 'Upgrade your kitchen! Get 30% off on all kitchen appliances including blenders, coffee makers, and more.',
        code: 'KITCHEN30',
        imagePath: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop',
        businessId: businesses[0].id,
        categoryId: categories[5].id,
        discountPercentage: 30,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Sports coupons
    prisma.coupon.create({
      data: {
        title: '20% OFF Gym Equipment',
        description: 'Build your home gym! 20% discount on all fitness equipment. Weights, treadmills, yoga mats, and more.',
        code: 'GYM20',
        imagePath: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        businessId: businesses[3].id,
        categoryId: categories[6].id,
        discountPercentage: 20,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '35% OFF Sports Apparel',
        description: 'Get active in style! 35% off on all sports apparel including athletic wear, running shoes, and accessories.',
        code: 'SPORT35',
        imagePath: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&h=600&fit=crop',
        businessId: businesses[1].id,
        categoryId: categories[6].id,
        discountPercentage: 35,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Entertainment coupons
    prisma.coupon.create({
      data: {
        title: '2 for 1 Movie Tickets',
        description: 'Enjoy movies for half the price! Buy one ticket and get one free. Valid for all shows and all days.',
        code: 'MOVIE2FOR1',
        imagePath: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=600&fit=crop',
        businessId: businesses[2].id,
        categoryId: categories[7].id,
        discountPercentage: 50,
        expirationDate: thirtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
    prisma.coupon.create({
      data: {
        title: '25% OFF Concert Tickets',
        description: 'Experience live music! Get 25% off on concert tickets for upcoming shows and festivals.',
        code: 'CONCERT25',
        imagePath: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
        businessId: businesses[2].id,
        categoryId: categories[7].id,
        discountPercentage: 25,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
  ])

  console.log(`✅ Created ${coupons.length} sample coupons`)

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - ${categories.length} categories`)
  console.log(`   - 1 admin user (admin@vibepeek.com / admin123)`)
  console.log(`   - ${businesses.length} business users (*/business123)`)
  console.log(`   - ${coupons.length} coupons (various statuses)`)
  console.log('\n💡 You can now log in and explore the platform!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

