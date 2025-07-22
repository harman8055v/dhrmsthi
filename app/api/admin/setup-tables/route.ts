import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("Setup tables API called");
    
    // Test basic connection first
    const { data: testUser, error: testError } = await supabase
      .from("users")
      .select("id")
      .limit(1)
    
    if (testError) {
      console.error("Database connection test failed:", testError);
      return NextResponse.json({ 
        error: "Database connection failed", 
        details: testError.message 
      }, { status: 500 });
    }
    
    console.log("Database connection successful");
    
    // Check if cities table exists
    const { data: citiesTest, error: citiesError } = await supabase
      .from("cities")
      .select("id")
      .limit(1)
    
    // Check if states table exists  
    const { data: statesTest, error: statesError } = await supabase
      .from("states")
      .select("id")
      .limit(1)
    
    const results: {
      database_connection: string;
      cities_table: string;
      states_table: string;
      cities_count: number;
      states_count: number;
      table_creation?: string;
    } = {
      database_connection: "✅ Connected",
      cities_table: citiesError ? `❌ ${citiesError.message}` : "✅ Exists",
      states_table: statesError ? `❌ ${statesError.message}` : "✅ Exists",
      cities_count: citiesTest?.length || 0,
      states_count: statesTest?.length || 0,
    };
    
    console.log("Table check results:", results);
    
    // If tables don't exist, try to create them
    if (citiesError || statesError) {
      console.log("Attempting to create missing tables...");
      
      try {
        // Use the SQL to create tables
        const createTablesSQL = `
          -- Create countries table first
          CREATE TABLE IF NOT EXISTS countries (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            code TEXT NOT NULL UNIQUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          -- Create states table
          CREATE TABLE IF NOT EXISTS states (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            state_code TEXT NOT NULL,
            country_id INTEGER REFERENCES countries(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(name, country_id)
          );

          -- Create cities table
          CREATE TABLE IF NOT EXISTS cities (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            state_id INTEGER REFERENCES states(id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(name, state_id)
          );

          -- Insert India as the primary country
          INSERT INTO countries (name, code) VALUES ('India', 'IN') ON CONFLICT (code) DO NOTHING;

          -- Insert major Indian states
          INSERT INTO states (name, state_code, country_id) 
          SELECT state_name, state_code, c.id 
          FROM (VALUES 
            ('Gujarat', 'GJ'),
            ('Maharashtra', 'MH'),
            ('Karnataka', 'KA'),
            ('Tamil Nadu', 'TN'),
            ('Delhi', 'DL'),
            ('Uttar Pradesh', 'UP'),
            ('West Bengal', 'WB'),
            ('Rajasthan', 'RJ'),
            ('Punjab', 'PB'),
            ('Haryana', 'HR')
          ) AS states_data(state_name, state_code)
          CROSS JOIN countries c
          WHERE c.code = 'IN'
          ON CONFLICT (name, country_id) DO NOTHING;

          -- Insert sample cities
          INSERT INTO cities (name, state_id)
          SELECT city_name, s.id
          FROM (VALUES 
            ('Mumbai'), ('Pune'), ('Ahmedabad'), ('Surat'), ('Bangalore'), 
            ('Chennai'), ('New Delhi'), ('Kolkata'), ('Jaipur'), ('Lucknow')
          ) AS cities_data(city_name)
          CROSS JOIN states s
          INNER JOIN countries c ON s.country_id = c.id
          WHERE c.code = 'IN' AND s.state_code IN ('MH', 'GJ', 'KA', 'TN', 'DL', 'UP', 'WB', 'RJ')
          ON CONFLICT (name, state_id) DO NOTHING;
        `;
        
        // Execute the SQL
        const { error: createError } = await supabase.rpc('exec_sql', { sql: createTablesSQL });
        
        if (createError) {
          console.error("Failed to create tables:", createError);
          results.table_creation = `❌ Failed: ${createError.message}`;
        } else {
          console.log("Tables created successfully");
          results.table_creation = "✅ Tables created successfully";
        }
        
      } catch (createErr) {
        console.error("Table creation error:", createErr);
        results.table_creation = `❌ Error: ${createErr instanceof Error ? createErr.message : 'Unknown error'}`;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: "Database setup check completed",
      results
    });
    
  } catch (error) {
    console.error("Setup tables API error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Allow GET requests too for easier testing
  return POST(request);
} 