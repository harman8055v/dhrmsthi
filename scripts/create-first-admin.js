const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createFirstAdmin() {
  try {
    console.log('🚀 Setting up first admin user...')
    
    // Check if admin users already exist
    const { data: existingAdmins, error: checkError } = await supabase
      .from('users')
      .select('id, email, role')
      .or('role.eq.admin,role.eq.super_admin')
      .limit(1)
    
    if (checkError) {
      console.error('❌ Error checking existing admins:', checkError)
      return
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('✅ Admin users already exist:')
      existingAdmins.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.role})`)
      })
      return
    }
    
    // Get user input for admin details
    const readline = require('readline')
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    
    const question = (query) => new Promise((resolve) => rl.question(query, resolve))
    
    console.log('\n📝 Please provide admin user details:')
    const email = await question('Email address: ')
    const firstName = await question('First name: ')
    const lastName = await question('Last name: ')
    const password = await question('Password (min 6 characters): ')
    
    rl.close()
    
    if (!email || !firstName || !lastName || !password) {
      console.log('❌ All fields are required!')
      return
    }
    
    if (password.length < 6) {
      console.log('❌ Password must be at least 6 characters!')
      return
    }
    
    console.log('\n🔄 Creating admin user...')
    
    // First, create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName
      }
    })
    
    if (authError) {
      console.error('❌ Error creating auth user:', authError)
      return
    }
    
    console.log('✅ Auth user created successfully')
    
    // Then, create the user profile in the users table
    const userProfileData = {
      id: authData.user.id,
      email: email,
      first_name: firstName,
      last_name: lastName,
      role: 'super_admin',
      is_active: true,
      email_verified: true,
      onboarding_completed: true,
      verification_status: 'verified',
      account_status: 'premium'
    }

    // Add timestamp columns if they exist (optional)
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert(userProfileData)
        .select()
        .single()
      
      if (profileError) {
        console.error('❌ Error creating user profile:', profileError)
        
        // Clean up auth user if profile creation failed
        await supabase.auth.admin.deleteUser(authData.user.id)
        console.log('🧹 Cleaned up auth user due to profile creation failure')
        return
      }
      
      console.log('✅ User profile created successfully')
    } catch (error) {
      console.error('❌ Error creating user profile:', error)
      
      // Clean up auth user if profile creation failed
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.log('🧹 Cleaned up auth user due to profile creation failure')
      return
    }
    
    // Log the admin login
    await supabase
      .from('login_history')
      .insert({
        user_id: authData.user.id,
        login_type: 'admin_creation',
        success: true,
        created_at: new Date().toISOString()
      })
    
    console.log('\n🎉 Admin user created successfully!')
    console.log('📋 Admin Details:')
    console.log(`   Email: ${email}`)
    console.log(`   Name: ${firstName} ${lastName}`)
    console.log(`   Role: super_admin`)
    console.log(`   ID: ${authData.user.id}`)
    
    console.log('\n🔗 You can now login at: http://localhost:3002/admin/login')
    console.log('⚠️  Please change the password after first login for security!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
createFirstAdmin() 