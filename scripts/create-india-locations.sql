-- Create table for Indian states
CREATE TABLE IF NOT EXISTS states (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    state_code TEXT NOT NULL
);

-- Create table for Indian cities
CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    state_code TEXT NOT NULL REFERENCES states(state_code)
);

-- Example inserts (add remaining via bulk import)
INSERT INTO states (id, name, state_code) VALUES (4023, 'Andaman and Nicobar Islands', 'AN') ON CONFLICT DO NOTHING;
INSERT INTO states (id, name, state_code) VALUES (4017, 'Andhra Pradesh', 'AP') ON CONFLICT DO NOTHING;
-- ... add all states here

-- Example city insert
INSERT INTO cities (id, name, state_code) VALUES (133436, 'Hyderabad', 'TG') ON CONFLICT DO NOTHING;
-- Add all cities similarly or use COPY to import from the json files in lib/data
