-- Create countries table
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

-- Insert sample countries
INSERT INTO countries (name, code) VALUES 
  ('India', 'IN'),
  ('United States', 'US'),
  ('Canada', 'CA'),
  ('United Kingdom', 'GB'),
  ('Australia', 'AU'),
  ('Germany', 'DE'),
  ('France', 'FR'),
  ('Japan', 'JP'),
  ('Singapore', 'SG'),
  ('United Arab Emirates', 'AE')
ON CONFLICT (code) DO NOTHING;

-- Insert Indian states
INSERT INTO states (name, state_code, country_id) 
SELECT state_name, state_code, c.id 
FROM (VALUES 
  ('Andhra Pradesh', 'AP'),
  ('Arunachal Pradesh', 'AR'),
  ('Assam', 'AS'),
  ('Bihar', 'BR'),
  ('Chhattisgarh', 'CG'),
  ('Goa', 'GA'),
  ('Gujarat', 'GJ'),
  ('Haryana', 'HR'),
  ('Himachal Pradesh', 'HP'),
  ('Jharkhand', 'JH'),
  ('Karnataka', 'KA'),
  ('Kerala', 'KL'),
  ('Madhya Pradesh', 'MP'),
  ('Maharashtra', 'MH'),
  ('Manipur', 'MN'),
  ('Meghalaya', 'ML'),
  ('Mizoram', 'MZ'),
  ('Nagaland', 'NL'),
  ('Odisha', 'OR'),
  ('Punjab', 'PB'),
  ('Rajasthan', 'RJ'),
  ('Sikkim', 'SK'),
  ('Tamil Nadu', 'TN'),
  ('Telangana', 'TG'),
  ('Tripura', 'TR'),
  ('Uttar Pradesh', 'UP'),
  ('Uttarakhand', 'UK'),
  ('West Bengal', 'WB'),
  ('Delhi', 'DL'),
  ('Jammu and Kashmir', 'JK'),
  ('Ladakh', 'LA'),
  ('Chandigarh', 'CH'),
  ('Dadra and Nagar Haveli and Daman and Diu', 'DN'),
  ('Lakshadweep', 'LD'),
  ('Puducherry', 'PY'),
  ('Andaman and Nicobar Islands', 'AN')
) AS states_data(state_name, state_code)
CROSS JOIN countries c
WHERE c.code = 'IN'
ON CONFLICT (name, country_id) DO NOTHING;

-- Insert major Indian cities for Gujarat (as example)
INSERT INTO cities (name, state_id)
SELECT city_name, s.id
FROM (VALUES 
  ('Ahmedabad'),
  ('Surat'),
  ('Vadodara'),
  ('Rajkot'),
  ('Bhavnagar'),
  ('Jamnagar'),
  ('Gandhinagar'),
  ('Junagadh'),
  ('Anand'),
  ('Bharuch'),
  ('Mehsana'),
  ('Morbi'),
  ('Nadiad'),
  ('Surendranagar'),
  ('Gandhidham'),
  ('Veraval'),
  ('Godhra'),
  ('Patan'),
  ('Kalol'),
  ('Dahod')
) AS cities_data(city_name)
CROSS JOIN states s
INNER JOIN countries c ON s.country_id = c.id
WHERE c.code = 'IN' AND s.state_code = 'GJ'
ON CONFLICT (name, state_id) DO NOTHING;

-- Insert major cities for Maharashtra
INSERT INTO cities (name, state_id)
SELECT city_name, s.id
FROM (VALUES 
  ('Mumbai'),
  ('Pune'),
  ('Nagpur'),
  ('Nashik'),
  ('Aurangabad'),
  ('Solapur'),
  ('Amravati'),
  ('Kolhapur'),
  ('Sangli'),
  ('Malegaon'),
  ('Akola'),
  ('Latur'),
  ('Dhule'),
  ('Ahmednagar'),
  ('Chandrapur'),
  ('Parbhani'),
  ('Ichalkaranji'),
  ('Jalgaon'),
  ('Bhiwandi'),
  ('Nanded')
) AS cities_data(city_name)
CROSS JOIN states s
INNER JOIN countries c ON s.country_id = c.id
WHERE c.code = 'IN' AND s.state_code = 'MH'
ON CONFLICT (name, state_id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_states_country_id ON states(country_id);
CREATE INDEX IF NOT EXISTS idx_cities_state_id ON cities(state_id);
CREATE INDEX IF NOT EXISTS idx_countries_code ON countries(code);
CREATE INDEX IF NOT EXISTS idx_states_state_code ON states(state_code);
