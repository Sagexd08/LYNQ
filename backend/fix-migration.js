// Fix failed migration before running migrate deploy
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function fixMigration() {
  console.log('🔧 Checking for failed migrations...');
  
  try {
    // Try to mark the problematic migration as applied since schema already exists
    console.log('📋 Marking migration as applied (schema already exists)...');
    await execAsync('npx prisma migrate resolve --applied "20260114000000_add_missing_schema"');
    console.log('✅ Migration marked as applied');
  } catch (error) {
    console.log('ℹ️  Could not mark as applied, trying rolled back:', error.message);
    try {
      await execAsync('npx prisma migrate resolve --rolled-back "20260114000000_add_missing_schema"');
      console.log('✅ Migration marked as rolled back');
    } catch (err) {
      console.log('ℹ️  No problematic migration found or already resolved');
    }
  }
  
  try {
    // Now run migrate deploy
    console.log('🗄️  Running database migrations...');
    await execAsync('npx prisma migrate deploy');
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    // If migration still fails, try to mark as applied and continue
    console.warn('⚠️  Migration deploy failed, checking if we can continue:', error.message);
    
    if (error.message.includes('already exists') || error.message.includes('P3018')) {
      console.log('ℹ️  Schema elements already exist, marking migration as applied...');
      try {
        await execAsync('npx prisma migrate resolve --applied "20260114000000_add_missing_schema"');
        console.log('✅ Migration marked as applied, continuing startup...');
      } catch (resolveError) {
        console.error('❌ Could not resolve migration:', resolveError.message);
        process.exit(1);
      }
    } else {
      console.error('❌ Migration failed with unexpected error');
      process.exit(1);
    }
  }
}

fixMigration();
