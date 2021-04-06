
DROP TABLE IF EXISTS cities;
CREATE TABLE cities (
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude NUMERIC(20, 14),
  longitude NUMERIC(20, 14)
);
