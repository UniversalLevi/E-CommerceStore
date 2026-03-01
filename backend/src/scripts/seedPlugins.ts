import { connectDatabase } from '../config/database';
import { Plugin } from '../models/Plugin';
import { PLUGIN_DEFINITIONS } from '../config/plugins';

async function seed() {
  try {
    await connectDatabase();
    for (const p of PLUGIN_DEFINITIONS) {
      await Plugin.findOneAndUpdate({ slug: p.slug }, p, { upsert: true, new: true });
    }
    console.log('Plugins seeded successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
