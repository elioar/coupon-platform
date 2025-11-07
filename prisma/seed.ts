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
    where: { email: 'admin@couponme.com' },
    update: {},
    create: {
      email: 'admin@couponme.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  })
  console.log('✅ Admin user created (email: admin@couponme.com, password: admin123)')

  // Create business users
  console.log('🏢 Creating business users...')
  const businessPassword = await bcrypt.hash('business123', 10)
  
  const businesses = await Promise.all([
    prisma.user.upsert({
      where: { email: 'techstore@example.com' },
      update: {},
      create: {
        email: 'techstore@example.com',
        password: businessPassword,
        name: 'TechStore',
        role: 'BUSINESS',
      },
    }),
    prisma.user.upsert({
      where: { email: 'fashionhub@example.com' },
      update: {},
      create: {
        email: 'fashionhub@example.com',
        password: businessPassword,
        name: 'Fashion Hub',
        role: 'BUSINESS',
      },
    }),
    prisma.user.upsert({
      where: { email: 'foodcorner@example.com' },
      update: {},
      create: {
        email: 'foodcorner@example.com',
        password: businessPassword,
        name: 'Food Corner',
        role: 'BUSINESS',
      },
    }),
    prisma.user.upsert({
      where: { email: 'travelpro@example.com' },
      update: {},
      create: {
        email: 'travelpro@example.com',
        password: businessPassword,
        name: 'Travel Pro',
        role: 'BUSINESS',
      },
    }),
  ])

  console.log(`✅ Created ${businesses.length} business users (password: business123)`)

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
        businessId: businesses[0].id,
        categoryId: categories[0].id,
        discountPercentage: 20,
        expirationDate: thirtyDaysFromNow,
        status: 'PENDING',
      },
    }),

    // Fashion coupons
    prisma.coupon.create({
      data: {
        title: 'Summer Sale - 40% OFF',
        description: 'Refresh your wardrobe with our summer collection! 40% discount on all clothing items. Limited stock available.',
        code: 'SUMMER40',
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
        businessId: businesses[1].id,
        categoryId: categories[1].id,
        discountPercentage: 33,
        expirationDate: thirtyDaysFromNow,
        status: 'REJECTED',
      },
    }),

    // Food coupons
    prisma.coupon.create({
      data: {
        title: '15% OFF All Orders',
        description: 'Enjoy delicious meals with 15% discount on all menu items. Order online or dine-in. Valid for all locations.',
        code: 'FOOD15',
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
        businessId: businesses[2].id,
        categoryId: categories[2].id,
        discountPercentage: 20,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Travel coupons
    prisma.coupon.create({
      data: {
        title: '35% OFF Hotel Bookings',
        description: 'Plan your dream vacation! Save 35% on hotel bookings worldwide. Luxury hotels at amazing prices.',
        code: 'HOTEL35',
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
        businessId: businesses[3].id,
        categoryId: categories[3].id,
        discountPercentage: 25,
        expirationDate: sixtyDaysFromNow,
        status: 'PENDING',
      },
    }),

    // Beauty coupons
    prisma.coupon.create({
      data: {
        title: '30% OFF Beauty Products',
        description: 'Glow up with 30% off on all beauty and skincare products. Premium brands at incredible prices.',
        code: 'BEAUTY30',
        businessId: businesses[1].id,
        categoryId: categories[4].id,
        discountPercentage: 30,
        expirationDate: thirtyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Home coupons
    prisma.coupon.create({
      data: {
        title: '45% OFF Home Decor',
        description: 'Transform your space! Get 45% discount on home decor items. Furniture, lighting, and accessories included.',
        code: 'HOME45',
        businessId: businesses[0].id,
        categoryId: categories[5].id,
        discountPercentage: 45,
        expirationDate: sixtyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Sports coupons
    prisma.coupon.create({
      data: {
        title: '20% OFF Gym Equipment',
        description: 'Build your home gym! 20% discount on all fitness equipment. Weights, treadmills, yoga mats, and more.',
        code: 'GYM20',
        businessId: businesses[3].id,
        categoryId: categories[6].id,
        discountPercentage: 20,
        expirationDate: ninetyDaysFromNow,
        status: 'APPROVED',
      },
    }),

    // Entertainment coupons
    prisma.coupon.create({
      data: {
        title: '2 for 1 Movie Tickets',
        description: 'Enjoy movies for half the price! Buy one ticket and get one free. Valid for all shows and all days.',
        code: 'MOVIE2FOR1',
        businessId: businesses[2].id,
        categoryId: categories[7].id,
        discountPercentage: 50,
        expirationDate: thirtyDaysFromNow,
        status: 'APPROVED',
      },
    }),
  ])

  console.log(`✅ Created ${coupons.length} sample coupons`)

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Summary:')
  console.log(`   - ${categories.length} categories`)
  console.log(`   - 1 admin user (admin@couponme.com / admin123)`)
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

