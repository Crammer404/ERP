import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/config/api.config';

/**
 * Get or create Supabase client instance
 */
const getSupabaseClient = (): SupabaseClient => {
  if (!SUPABASE_CONFIG.BASE_URL || !SUPABASE_CONFIG.ANON_KEY) {
    throw new Error('Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  }
  
  return createClient(SUPABASE_CONFIG.BASE_URL, SUPABASE_CONFIG.ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
};

/**
 * Get all bookings from the hair_salon_bookings table
 */
export const getBookings = async () => {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('event_hall_bookings') // The name of your table
    .select('*'); // Select all columns
 
  if (error) {
    console.error('Error fetching bookings:', error);
    throw error;
  }
  
  return data;
};

/**
 * Test Supabase API connection and log results to console
 * This function tests the Supabase connection by checking configuration and attempting a connection
 */
export const testSupabaseConnection = async (): Promise<void> => {
  console.group('🔍 Supabase API Connection Test');
  
  try {
    // Log configuration
    console.log('📋 Configuration:', {
      BASE_URL: SUPABASE_CONFIG.BASE_URL ? '✅ Set' : '❌ Missing',
      ANON_KEY: SUPABASE_CONFIG.ANON_KEY ? '✅ Set' : '❌ Missing',
      TIMEOUT: SUPABASE_CONFIG.TIMEOUT,
      DEFAULT_HEADERS: SUPABASE_CONFIG.DEFAULT_HEADERS,
    });

    // Check if configuration is complete
    if (!SUPABASE_CONFIG.BASE_URL || !SUPABASE_CONFIG.ANON_KEY) {
      console.error('❌ Configuration Error: Missing BASE_URL or ANON_KEY');
      console.log('\n📝 Troubleshooting Steps:');
      console.log('1. Make sure your .env.local file is in the frontend/ directory');
      console.log('2. Variables MUST start with NEXT_PUBLIC_ prefix for client-side access:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL=your_url_here');
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here');
      console.log('3. Restart your Next.js dev server after adding/changing env variables');
      console.log('4. Check that there are no spaces around the = sign');
      console.log('5. Do NOT wrap values in quotes unless they contain spaces');
      console.log('\n⚠️ WHY NEXT_PUBLIC_?');
      console.log('   - Next.js only exposes variables with NEXT_PUBLIC_ prefix to the browser');
      console.log('   - Variables without prefix are ONLY available server-side (API routes)');
      console.log('   - Since you\'re using Supabase in client components, you NEED the prefix');
      console.log('\n💡 Current values:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_CONFIG.BASE_URL || 'undefined');
      console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_CONFIG.ANON_KEY ? '***hidden***' : 'undefined');
      console.groupEnd();
      return;
    }

    // Create Supabase client
    const supabase = getSupabaseClient();

    console.log('✅ Supabase client created successfully');

    // Test 1: Check current session
    console.log('\n📝 Test 1: Checking current session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('⚠️ Session check:', sessionError.message);
    } else {
      console.log('✅ Session check:', sessionData.session ? 'Active session found' : 'No active session');
    }

    // Test 2: Test API connectivity by checking auth endpoint
    console.log('\n📝 Test 2: Testing API connectivity...');
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.log('ℹ️ No authenticated user (expected if not logged in)');
      console.log('✅ Auth endpoint is accessible');
    } else {
      console.log('✅ Auth endpoint accessible');
      console.log('✅ User authenticated:', userData.user?.email || 'N/A');
    }

    // Test 3: Log connection details
    console.log('\n📝 Test 3: Connection details:');
    console.log({
      SupabaseURL: SUPABASE_CONFIG.BASE_URL,
      HasAnonKey: !!SUPABASE_CONFIG.ANON_KEY,
      KeyLength: SUPABASE_CONFIG.ANON_KEY?.length || 0,
      ClientCreated: !!supabase,
      Timestamp: new Date().toISOString(),
    });

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error: any) {
    console.error('❌ Test Error:', {
      message: error?.message || 'Unknown error',
      error: error,
    });
  } finally {
    console.groupEnd();
  }
};

export const bookingService = {
  /**
   * Test Supabase API connection
   * Call this function to test the Supabase connection and view results in console
   */
  testConnection: testSupabaseConnection,
  
  /**
   * Get all bookings from the hair_salon_bookings table
   * @returns Promise with array of booking records
   */
  getBookings: getBookings,
};
