// scripts/seed.ts
require('dotenv').config();
const { init, id } = require('@instantdb/admin');

// Verify environment variables are set
const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;

if (!APP_ID) {
  console.error("Error: INSTANT_APP_ID environment variable is not set.");
  console.error("Please make sure you have created a .env file with INSTANT_APP_ID=your_app_id_here");
  process.exit(1);
}

if (!ADMIN_TOKEN) {
  console.error("Error: INSTANT_APP_ADMIN_TOKEN environment variable is not set.");
  console.error("Please make sure you have created a .env file with INSTANT_APP_ADMIN_TOKEN=your_admin_token_here");
  process.exit(1);
}

console.log(`Using Instant app ID: ${APP_ID}`);

// Initialize InstantDB with admin token
const db = init({
  appId: APP_ID,
  adminToken: ADMIN_TOKEN,
});

// Arrays for generating random content
const adjectives = [
  'Hungry', 'Funny', 'Happy', 'Sleepy', 'Curious', 'Brave', 'Creative',
  'Gentle', 'Wise', 'Calm', 'Bright', 'Peaceful', 'Joyful', 'Energetic',
  'Thoughtful', 'Mindful', 'Sincere', 'Grateful', 'Humble', 'Friendly'
];

const animals = [
  'Hippo', 'Duck', 'Tiger', 'Panda', 'Dolphin', 'Owl', 'Koala',
  'Fox', 'Wolf', 'Bear', 'Eagle', 'Lion', 'Rabbit', 'Squirrel',
  'Turtle', 'Elephant', 'Giraffe', 'Penguin', 'Kangaroo', 'Raccoon'
];

const bioFirstSentences = [
  'Finding joy in the ordinary moments is my superpower.',
  'I believe every day is a canvas waiting for color.',
  'Life taught me that kindness is the greatest wisdom.',
  'I approach challenges as opportunities in disguise.',
  'My journey is about growth, not perfection.',
  'Embracing simplicity has brought clarity to my life.',
  "I'm a collector of stories and moments of connection.",
  'The universe reminds me daily of its abundant grace.',
  'Nurturing creativity has become my daily practice.',
  'I find wisdom in both stillness and movement.'
];

const bioSecondSentences = [
  "When not writing, I'm exploring trails and finding peace in nature.",
  'Every sunset is a reminder that endings can be beautiful too.',
  'The best days are those filled with laughter and learning.',
  'My goal is to leave each space better than I found it.',
  'I believe in the transformative power of deep listening.',
  'Gratitude is the foundation of my daily practice.',
  'Each breath reminds me to stay present in this moment.',
  'The journey inward has been my most rewarding adventure.',
  'Small acts of kindness create ripples of positive change.',
  "In simplicity, I've discovered abundance beyond measure."
];

// Title templates for creative content
const postTitles = [
  'The Wisdom of the {animal}',
  'A {adjective} Journey',
  'Lessons from the {adjective} {animal}',
  "The {animal}'s Gift",
  "When {adjective} Met {animal}",
  'Beneath the {adjective} Sky',
  'Whispers of the {animal}',
  'The {adjective} Path',
  'Reflections on {adjective} Living',
  'Dancing with {animal}s'
];

// Helper function to get random item from array
function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random number between min and max (inclusive)
function getRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Generate a random email
function generateEmail(): string {
  const adjective = getRandomItem(adjectives);
  const animal = getRandomItem(animals);
  const number = getRandomNumber(1000, 9999);
  return `${adjective}${animal}${number}@example.com`;
}

// Generate a handle from email
function generateHandle(email: string): string {
  return email.split('@')[0].replace(/[0-9]/g, '');
}

// Generate a random bio
function generateBio(): string {
  return `${getRandomItem(bioFirstSentences)} ${getRandomItem(bioSecondSentences)}`;
}

// Generate a creative post (poem or short story)
function generateCreativePost(userHandle: string): {
  title: string;
  content: string;
} {
  const adjective = getRandomItem(adjectives).toLowerCase();
  const animal = getRandomItem(animals).toLowerCase();

  // Replace placeholders in title template
  let title = getRandomItem(postTitles)
    .replace('{adjective}', adjective.charAt(0).toUpperCase() + adjective.slice(1))
    .replace('{animal}', animal);

  // Generate content based on post type (randomly choose poem or fable)
  const isPoem = Math.random() > 0.5;

  let content = '';

  if (isPoem) {
    // Generate a poem
    content = generatePoem(adjective, animal);
  } else {
    // Generate a short fable
    content = generateFable(adjective, animal);
  }

  return { title, content };
}

// Generate a poem
function generatePoem(adjective: string, animal: string): string {
  const templates = [
    `In the quiet of morning, a ${adjective} ${animal} wakes,\nEyes bright with purpose, each moment it takes.\nMoving through life with a gentle stride,\nCarrying wisdom and peace inside.\n\nWe could learn from this creature's simple way,\nHow to embrace the gifts of each day.\nTo find joy in the small things, to live with grace,\nAnd move through the world at a mindful pace.\n\nSo when life feels too heavy, or the path seems unclear,\nRemember the ${animal}, and what makes it dear.\nIts ${adjective} nature, its presence so true,\nThe lessons it offers for me and for you.`,

    `The ${animal} doesn't worry about tomorrow,\nOr dwell too long in past sorrow.\nIt lives in the moment, ${adjective} and free,\nA beautiful lesson for you and me.\n\nWith each step it takes on this earth,\nIt celebrates life and knows its worth.\nNot concerned with status or fame,\nJust being itself is the ${animal}'s aim.\n\nPerhaps in our rush, we've forgotten this truth,\nThe simplicity of being is the fountain of youth.\nTo be ${adjective} like the ${animal}, present and aware,\nIs to find the freedom from needless care.`,

    `There once was a ${adjective} ${animal},\nWhose spirit was truly magical.\nIt moved through life with gentle grace,\nBringing light to every place.\n\nIt taught without speaking a word,\nIts message clear, though never heard:\nLive fully in each precious moment,\nFind beauty where others don't know it.\n\nSo when you feel lost or alone,\nRemember the ${animal}'s wisdom shown.\nBe ${adjective} in your approach to each day,\nAnd watch how the darkness fades away.`
  ];

  return getRandomItem(templates);
}

// Generate a fable
function generateFable(adjective: string, animal: string): string {
  const templates = [
    `Long ago, in a forest where wisdom grew like trees, lived a ${adjective} ${animal}. Unlike others of its kind, this ${animal} approached life with unusual ${adjective}ness, seeing opportunity where others saw challenge.\n\nOne particularly harsh winter, when food became scarce and other creatures grew fearful and competitive, the ${adjective} ${animal} began to share what little it had. "Why would you give away your sustenance?" asked a puzzled fox. "Because," replied the ${animal}, "the wealth of community outweighs the poverty of isolation."\n\nAs days passed, inspired by the ${animal}'s example, other creatures began to share as well. Soon, the forest transformed into a network of mutual support. When spring finally arrived, the animals discovered that not only had they all survived, but they had formed bonds that would sustain them through all seasons.\n\nThe moral? Sometimes our greatest resource isn't what we possess, but our ${adjective} approach to life's challenges.`,

    `In the valley of Serene Waters lived a ${animal} known throughout the land for its ${adjective} nature. Each morning, the ${animal} would greet the day with gratitude, taking time to appreciate the dew on the grass and the song of the wind.\n\nOther creatures rushed through their days, too busy gathering and competing to notice the beauty around them. "You waste too much time in pointless observation," they would tell the ${animal}. "Life is about achievement and gain."\n\nThe ${animal} would simply smile and continue its ${adjective} contemplation.\n\nThen came the great drought, when the usual water sources disappeared. While others panicked, the ${animal} led them to a hidden spring it had discovered during its mindful wanderings. "Sometimes," said the ${animal}, "what seems like wasted time is actually wisdom gathering."\n\nAnd so the creatures learned that a ${adjective} approach to life—one that values awareness over constant activity—often sees what rushed eyes miss.`,

    `A ${adjective} ${animal} once lived at the edge of a bustling village. While admired for its ${adjective}ness, many villagers couldn't understand why the creature chose solitude over society.\n\n"Aren't you lonely?" a young girl asked one day, having wandered to the ${animal}'s home.\n\n"There's a difference," the ${animal} replied, "between being alone and being lonely. In quietude, I hear whispers of wisdom that noise drowns out."\n\nCurious, the girl began visiting regularly, learning to sit in peaceful silence with her new friend. Gradually, she began to notice things she'd never seen before: the intricate patterns of leaves, the colorful dialogues between butterflies, the subtle changes in the sky's mood.\n\nWhen she returned to the village, her insights brought fresh perspectives to problems that had long troubled her community. "How did you become so wise?" they asked. "I learned to be ${adjective} from my friend the ${animal}," she answered. "And discovered that sometimes, stepping back helps us see more clearly."`
  ];

  return getRandomItem(templates);
}

// Create a user with profile and posts
async function createUser() {
  try {
    // Generate random user data
    const email = generateEmail();
    const handle = generateHandle(email);
    const bio = generateBio();

    console.log(`Creating user: ${email} with handle: ${handle}`);

    // Create a token for the user
    const token = await db.auth.createToken(email);

    // Get user ID from the token
    const userInfo = await db.auth.verifyToken(token);
    const userId = userInfo.id;

    if (!userId) {
      throw new Error('Failed to create user');
    }

    console.log(`User created with ID: ${userId}`);

    // Generate profile ID
    const profileId = id();

    // Determine random number of posts (8-24)
    const numPosts = getRandomNumber(8, 24);
    console.log(`Generating ${numPosts} posts for user ${handle}`);

    // Create transaction chunks
    const transactions = [];

    // Add profile creation
    transactions.push(
      db.tx.profiles[profileId].update({
        handle,
        bio,
        createdAt: Date.now(),
        socialLinks: {}
      }).link({ $user: userId })
    );

    // Generate and add posts (with some randomized data)
    for (let i = 0; i < numPosts; i++) {
      const postId = id();
      const post = generateCreativePost(handle);

      // Calculate a random date in the past (from 1 day to 100 days ago)
      const daysAgo = getRandomNumber(1, 100);
      const createdAt = Date.now() - (1000 * 60 * 60 * 24 * daysAgo);

      // Randomly decide if the post is published (80% chance) or draft (20% chance)
      const isPublished = Math.random() < 0.8;

      transactions.push(
        db.tx.posts[postId].update({
          title: post.title,
          content: post.content,
          createdAt: createdAt,
          updatedAt: createdAt,
          published: isPublished
        }).link({ author: profileId })
      );
    }

    // Create profile and posts in a single transaction
    const result = await db.transact(transactions);

    console.log(`Successfully created profile and ${numPosts} posts for ${handle}`);
    return { email, handle, userId, profileId, numPosts };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}


// Main function to seed data
async function seedData(numUsers: number = 3) {
  console.log(`Starting seed process for ${numUsers} users...`);

  const createdUsers = [];

  for (let i = 0; i < numUsers; i++) {
    try {
      const user = await createUser();
      createdUsers.push(user);
      console.log(`Created user ${i + 1}/${numUsers}: ${user.handle}`);
    } catch (error) {
      console.error(`Failed to create user ${i + 1}:`, error);
    }

    // Add a small delay between user creations to avoid rate limiting
    if (i < numUsers - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log(`\nSeeding complete! Created ${createdUsers.length} users:`);
  createdUsers.forEach(user => {
    console.log(`- ${user.handle} (${user.email})`);
  });
}

// Run the seed function with command line arguments
const numUsers = process.argv[2] ? parseInt(process.argv[2]) : 3;
seedData(numUsers)
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
