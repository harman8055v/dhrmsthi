// Script to verify production plans in Razorpay
// Run this with: node scripts/verify-production-plans.js

const Razorpay = require('razorpay');

// Initialize Razorpay (you'll need to set these environment variables)
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const productionPlans = [
  {
    id: 'plan_sparsh_monthly',
    name: 'Sparsh Plan Monthly',
    amount: 39900
  },
  {
    id: 'plan_sparsh_quarterly',
    name: 'Sparsh Plan Quarterly',
    amount: 99900
  },
  {
    id: 'plan_sangam_monthly',
    name: 'Sangam Plan Monthly',
    amount: 69900
  },
  {
    id: 'plan_sangam_quarterly',
    name: 'Sangam Plan Quarterly',
    amount: 179900
  },
  {
    id: 'plan_samarpan_monthly',
    name: 'Samarpan Plan Monthly',
    amount: 129900
  },
  {
    id: 'plan_samarpan_quarterly',
    name: 'Samarpan Plan Quarterly',
    amount: 299900
  },
  {
    id: 'plan_elite_monthly',
    name: 'Elite Membership Monthly',
    amount: 4900000
  },
  {
    id: 'plan_elite_quarterly',
    name: 'Elite Membership Quarterly',
    amount: 12900000
  }
];

async function verifyProductionPlans() {
  try {
    console.log('🔍 Verifying production plans in Razorpay...\n');
    
    let allPlansExist = true;
    
    for (const plan of productionPlans) {
      try {
        const planDetails = await razorpay.plans.fetch(plan.id);
        
        if (planDetails.item.amount === plan.amount) {
          console.log(`✅ ${plan.name} (${plan.id}) - ₹${plan.amount/100} - EXISTS`);
        } else {
          console.log(`⚠️  ${plan.name} (${plan.id}) - AMOUNT MISMATCH: Expected ₹${plan.amount/100}, Found ₹${planDetails.item.amount/100}`);
          allPlansExist = false;
        }
      } catch (error) {
        console.log(`❌ ${plan.name} (${plan.id}) - NOT FOUND`);
        allPlansExist = false;
      }
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (allPlansExist) {
      console.log('🎉 All production plans are properly configured!');
      console.log('✅ Your payment system is ready for production.');
    } else {
      console.log('⚠️  Some plans are missing or have incorrect amounts.');
      console.log('Please create the missing plans in your Razorpay dashboard.');
      console.log('See scripts/setup-razorpay-plans.sql for detailed instructions.');
    }
    
    console.log('\n📋 Next steps:');
    console.log('1. Ensure webhook is configured: https://yourdomain.com/api/payments/webhook');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Test payment flow with real plans');
    
  } catch (error) {
    console.error('❌ Error verifying plans:', error.message);
    
    if (error.message.includes('Invalid key')) {
      console.log('\n💡 Make sure you have set the correct production Razorpay keys:');
      console.log('   RAZORPAY_KEY_ID=your_production_key_id');
      console.log('   RAZORPAY_KEY_SECRET=your_production_key_secret');
    }
  }
}

// Check if environment variables are set
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables');
  console.log('\n💡 Add these to your .env.local file:');
  console.log('   RAZORPAY_KEY_ID=your_production_key_id');
  console.log('   RAZORPAY_KEY_SECRET=your_production_key_secret');
  process.exit(1);
}

verifyProductionPlans(); 