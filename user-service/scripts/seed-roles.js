import sequelize from '../config/database.js';
import Role from '../models/Role.js';
import dotenv from 'dotenv';

dotenv.config({ path: './config.env' });

const seedRoles = async () => {
  try {
    console.log('🌱 Seeding default roles...');

    const defaultRoles = [
      {
        name: 'buyer',
        description: 'Standard buyer role with purchase and review permissions'
      },
      {
        name: 'seller',
        description: 'Seller role with inventory, product, and order management permissions'
      },
      {
        name: 'admin',
        description: 'Administrator with full platform access'
      }
    ];

    for (const roleData of defaultRoles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });

      if (created) {
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`ℹ️  Role already exists: ${roleData.name}`);
      }
    }

    console.log('\n✅ Role seeding completed!');
    const roles = await Role.findAll();
    console.log(`📊 Total roles in database: ${roles.length}`);

  } catch (error) {
    console.error('❌ Role seeding failed:', error);
  } finally {
    await sequelize.close();
  }
};

// Run seed
seedRoles();
