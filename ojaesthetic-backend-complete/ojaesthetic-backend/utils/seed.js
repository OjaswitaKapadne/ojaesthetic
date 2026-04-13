/**
 * utils/seed.js
 * Seeds the database with admin user + sample artworks
 * Run: node utils/seed.js
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config();

const User    = require('../models/User');
const Artwork = require('../models/Artwork');
const Review  = require('../models/Review');

const SAMPLE_ARTWORKS = [
  {
    title:        'Bloom in Teal',
    description:  'A soft, textured painting exploring the quiet beauty of teal florals in bloom.',
    category:     'Painting',
    imageUrl:     'https://via.placeholder.com/800x1000/6EC6C3/ffffff?text=Bloom+in+Teal',
    tags:         ['floral', 'teal', 'textured', 'soft'],
    price:        4500,
    downloadable: false,
    featured:     true,
  },
  {
    title:        'Soft Horizon',
    description:  'Layers of turquoise and mint dissolving into a dreamy, minimal horizon.',
    category:     'Painting',
    imageUrl:     'https://via.placeholder.com/800x1000/3FA7A3/ffffff?text=Soft+Horizon',
    tags:         ['abstract', 'minimal', 'horizon', 'calm'],
    price:        3800,
    downloadable: false,
    featured:     true,
  },
  {
    title:        'Whisper of Petals',
    description:  'A delicate pencil sketch capturing the fragility of falling petals.',
    category:     'Sketch',
    imageUrl:     'https://via.placeholder.com/800x1000/B8E1DD/2F4F4F?text=Whisper+of+Petals',
    tags:         ['sketch', 'floral', 'delicate', 'pencil'],
    price:        2200,
    downloadable: true,
    featured:     false,
  },
  {
    title:        'Still Waters',
    description:  'A digital illustration of a butterfly reflected in perfectly still waters.',
    category:     'Digital',
    imageUrl:     'https://via.placeholder.com/800x1000/EAF7F6/3FA7A3?text=Still+Waters',
    tags:         ['butterfly', 'digital', 'reflection', 'teal'],
    price:        1800,
    downloadable: true,
    featured:     false,
  },
  {
    title:        'Reverie',
    description:  'A mixed media canvas that breathes soft light and quiet emotion.',
    category:     'Mixed Media',
    imageUrl:     'https://via.placeholder.com/800x1000/6EC6C3/ffffff?text=Reverie',
    tags:         ['mixed media', 'ethereal', 'light'],
    price:        5500,
    downloadable: false,
    featured:     true,
  },
  {
    title:        'Ephemeral Bloom',
    description:  'Graphite meets watercolor in this delicate study of a single flower.',
    category:     'Sketch',
    imageUrl:     'https://via.placeholder.com/800x1000/B8E1DD/2F4F4F?text=Ephemeral+Bloom',
    tags:         ['watercolor', 'floral', 'sketch'],
    price:        2800,
    downloadable: false,
    featured:     false,
  },
];

const SAMPLE_REVIEWS = [
  { text: 'Absolutely in love with the artwork! It feels so soft and expressive 💕', rating: 5 },
  { text: 'Ojaesthetic truly captures emotions through colors. A rare gift.', rating: 5 },
  { text: 'Every piece feels like a story. So calming and beautiful!', rating: 5 },
  { text: 'This is not just art, it\'s a feeling ✨ I keep returning to it.', rating: 5 },
];

async function seed() {
  try {
    console.log('🌱 Connecting to database…');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected');

    // ---- Admin user ----
    let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
    if (!admin) {
      admin = await User.create({
        name:     process.env.ADMIN_NAME     || 'Oja Admin',
        email:    process.env.ADMIN_EMAIL    || 'admin@ojaesthetic.com',
        password: process.env.ADMIN_PASSWORD || 'Admin@Oja2025!',
        role:     'admin',
      });
      console.log(`👑 Admin created: ${admin.email}`);
    } else {
      console.log(`👑 Admin already exists: ${admin.email}`);
    }

    // ---- Sample artworks ----
    const existing = await Artwork.countDocuments();
    if (existing === 0) {
      const artworks = await Artwork.insertMany(
        SAMPLE_ARTWORKS.map((a) => ({ ...a, createdBy: admin._id }))
      );
      console.log(`🎨 ${artworks.length} artworks seeded`);

      // ---- Sample reviews (linked to first artwork) ----
      // Create a test user to attach reviews to
      let testUser = await User.findOne({ email: 'test@ojaesthetic.com' });
      if (!testUser) {
        testUser = await User.create({
          name: 'Test User', email: 'test@ojaesthetic.com', password: 'Test@1234!',
        });
      }
      for (const rev of SAMPLE_REVIEWS) {
        await Review.create({
          userId:        testUser._id,
          text:          rev.text,
          rating:        rev.rating,
          isApproved:    true,
          isHighlighted: true,
        });
      }
      console.log(`⭐ ${SAMPLE_REVIEWS.length} reviews seeded`);
    } else {
      console.log(`ℹ️  Artworks already exist (${existing}), skipping artwork seed`);
    }

    console.log('\n✨ Seed complete! Admin credentials:');
    console.log(`   Email:    ${process.env.ADMIN_EMAIL    || 'admin@ojaesthetic.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'Admin@Oja2025!'}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
