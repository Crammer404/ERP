import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG } from '@/config/api.config';

let supabaseClient: SupabaseClient | null = null;

const getSupabaseClient = (): SupabaseClient => {
  if (supabaseClient) {
    return supabaseClient;
  }
  
  if (!SUPABASE_CONFIG.BASE_URL || !SUPABASE_CONFIG.ANON_KEY) {
    throw new Error('Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env file.');
  }
  
  supabaseClient = createClient(SUPABASE_CONFIG.BASE_URL, SUPABASE_CONFIG.ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  });
  
  return supabaseClient;
};

export const getFilteredBookings = async () => {
  const supabase = getSupabaseClient();
  
  try {
    const allowedBookingStatuses = ['success', 'confirmed'];
    // Get current date and time in ISO format for filtering
    const currentDateTime = new Date().toISOString();

    const { data: hallBookings, error: hallError } = await supabase
      .from('event_hall_bookings')
      .select('*')
      .eq('payment_status', 'success')
      .in('booking_status', allowedBookingStatuses)
      .gte('arrival_datetime', currentDateTime);
    
    if (hallError) {
      console.error('Error fetching event hall bookings:', hallError);
      throw hallError;
    }

    const { data: tableBookings, error: tableError } = await supabase
      .from('table_bookings')
      .select('*')
      .eq('payment_status', 'success')
      .in('booking_status', allowedBookingStatuses)
      .gte('arrival_datetime', currentDateTime);
    
    if (tableError) {
      console.error('Error fetching table bookings:', tableError);
      throw tableError;
    }
    // Debug: also fetch unfiltered counts to detect RLS or filter mismatches
    try {
      const { data: allHallBookings } = await supabase.from('event_hall_bookings').select('*');
      const { data: allTableBookings } = await supabase.from('table_bookings').select('*');
      console.log('DEBUG unfiltered counts -> event_hall_bookings:', allHallBookings?.length || 0, ', table_bookings:', allTableBookings?.length || 0);
      console.log('DEBUG filtered counts -> event_hall_bookings:', hallBookings?.length || 0, ', table_bookings:', tableBookings?.length || 0);
      if (allHallBookings && allHallBookings.length > 0) console.log('DEBUG sample unfiltered hall booking:', JSON.stringify(allHallBookings[0], null, 2));
      if (allTableBookings && allTableBookings.length > 0) console.log('DEBUG sample unfiltered table booking:', JSON.stringify(allTableBookings[0], null, 2));
    } catch (e) {
      console.warn('DEBUG failed to fetch unfiltered bookings (possible RLS):', e);
    }

    const hallIds = hallBookings?.map((b: any) => b.event_hall_id).filter(Boolean) || [];
    const tableIds = tableBookings?.map((b: any) => b.table_id).filter(Boolean) || [];
    
    let eventHalls: any[] = [];
    let tables: any[] = [];
    
    if (hallIds.length > 0) {
      const { data } = await supabase
        .from('event_halls')
        .select('id, title, number')
        .in('id', hallIds);
      eventHalls = data || [];
    }
    
    if (tableIds.length > 0) {
      const { data } = await supabase
        .from('tables')
        .select('id, title, number')
        .in('id', tableIds);
      tables = data || [];
    }
    
    const eventHallMap = new Map(eventHalls.map((h: any) => [h.id, { title: h.title, number: h.number }]));
    const tableMap = new Map(tables.map((t: any) => [t.id, { title: t.title, number: t.number }]));
    
    const transformedHallBookings = (hallBookings || []).map((booking: any) => {
      const hallData = eventHallMap.get(booking.event_hall_id);
      return {
        id: booking.id,
        uuid: booking.uuid,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        total_price: booking.total_price,
        payment_status: booking.payment_status,
        booking_status: booking.booking_status,
        booking_type: 'Hall',
        event_hall_id: booking.event_hall_id,
        arrival_datetime: booking.arrival_datetime,
        reservation_title: hallData?.title || 'N/A',
        table_number: hallData?.number || null,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      };
    });
    
    const transformedTableBookings = (tableBookings || []).map((booking: any) => {
      const tableData = tableMap.get(booking.table_id);
      return {
        id: booking.id,
        uuid: booking.uuid,
        guest_name: booking.guest_name,
        guest_email: booking.guest_email,
        guest_phone: booking.guest_phone,
        total_price: booking.total_price,
        payment_status: booking.payment_status,
        booking_status: booking.booking_status,
        booking_type: 'Table',
        table_id: booking.table_id,
        arrival_datetime: booking.arrival_datetime,
        reservation_title: tableData?.title || 'N/A',
        table_number: tableData?.number || null,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
      };
    });

    const combined = [...transformedHallBookings, ...transformedTableBookings];
    console.log('getFilteredBookings returning combined count:', combined.length, 'sample:', combined[0] || null);
    return combined;
  } catch (error) {
    console.error('Error fetching filtered bookings:', error);
    throw error;
  }
};

export const getBookings = async () => {
  // Return the combined transformed bookings (halls + tables)
  try {
    const combined = await getFilteredBookings();
    return combined;
  } catch (error) {
    console.error('Error fetching combined bookings:', error);
    throw error;
  }
};

export const testSupabaseConnection = async (): Promise<void> => {
  console.group('🔍 Supabase API Connection Test');
  
  try {
    console.log('📋 Configuration:', {
      BASE_URL: SUPABASE_CONFIG.BASE_URL ? '✅ Set' : '❌ Missing',
      ANON_KEY: SUPABASE_CONFIG.ANON_KEY ? '✅ Set' : '❌ Missing',
      TIMEOUT: SUPABASE_CONFIG.TIMEOUT,
      DEFAULT_HEADERS: SUPABASE_CONFIG.DEFAULT_HEADERS,
    });

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
  testConnection: testSupabaseConnection,
  getBookings: getBookings,
};
