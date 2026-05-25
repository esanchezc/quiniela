-- seed_group_stage.sql
-- 72 Matches total (Groups A - L)

-- Group A
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'South Africa'), 'Group Stage', '2026-06-11T19:00:00Z', 'Mexico City'),
((SELECT id FROM teams WHERE name = 'South Korea'), (SELECT id FROM teams WHERE name = 'Czechia'), 'Group Stage', '2026-06-12T02:00:00Z', 'Guadalajara'),
((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'South Korea'), 'Group Stage', '2026-06-16T18:00:00Z', 'Monterrey'),
((SELECT id FROM teams WHERE name = 'South Africa'), (SELECT id FROM teams WHERE name = 'Czechia'), 'Group Stage', '2026-06-16T21:00:00Z', 'Mexico City'),
((SELECT id FROM teams WHERE name = 'Czechia'), (SELECT id FROM teams WHERE name = 'Mexico'), 'Group Stage', '2026-06-24T21:00:00Z', 'Mexico City'),
((SELECT id FROM teams WHERE name = 'South Africa'), (SELECT id FROM teams WHERE name = 'South Korea'), 'Group Stage', '2026-06-24T21:00:00Z', 'Monterrey');

-- Group B
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Canada'), (SELECT id FROM teams WHERE name = 'Bosnia and Herzegovina'), 'Group Stage', '2026-06-12T19:00:00Z', 'Toronto'),
((SELECT id FROM teams WHERE name = 'Qatar'), (SELECT id FROM teams WHERE name = 'Switzerland'), 'Group Stage', '2026-06-13T02:00:00Z', 'Vancouver'),
((SELECT id FROM teams WHERE name = 'Canada'), (SELECT id FROM teams WHERE name = 'Qatar'), 'Group Stage', '2026-06-17T18:00:00Z', 'Toronto'),
((SELECT id FROM teams WHERE name = 'Bosnia and Herzegovina'), (SELECT id FROM teams WHERE name = 'Switzerland'), 'Group Stage', '2026-06-17T21:00:00Z', 'Vancouver'),
((SELECT id FROM teams WHERE name = 'Switzerland'), (SELECT id FROM teams WHERE name = 'Canada'), 'Group Stage', '2026-06-24T18:00:00Z', 'Vancouver'),
((SELECT id FROM teams WHERE name = 'Bosnia and Herzegovina'), (SELECT id FROM teams WHERE name = 'Qatar'), 'Group Stage', '2026-06-24T18:00:00Z', 'Toronto');

-- Group C
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Brazil'), (SELECT id FROM teams WHERE name = 'Morocco'), 'Group Stage', '2026-06-13T22:00:00Z', 'New York/NJ'),
((SELECT id FROM teams WHERE name = 'Haiti'), (SELECT id FROM teams WHERE name = 'Scotland'), 'Group Stage', '2026-06-14T19:00:00Z', 'Boston'),
((SELECT id FROM teams WHERE name = 'Brazil'), (SELECT id FROM teams WHERE name = 'Haiti'), 'Group Stage', '2026-06-18T22:00:00Z', 'Philadelphia'),
((SELECT id FROM teams WHERE name = 'Morocco'), (SELECT id FROM teams WHERE name = 'Scotland'), 'Group Stage', '2026-06-19T01:00:00Z', 'New York/NJ'),
((SELECT id FROM teams WHERE name = 'Scotland'), (SELECT id FROM teams WHERE name = 'Brazil'), 'Group Stage', '2026-06-25T21:00:00Z', 'New York/NJ'),
((SELECT id FROM teams WHERE name = 'Morocco'), (SELECT id FROM teams WHERE name = 'Haiti'), 'Group Stage', '2026-06-25T21:00:00Z', 'Boston');

-- Group D
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'Paraguay'), 'Group Stage', '2026-06-13T01:00:00Z', 'Los Angeles'),
((SELECT id FROM teams WHERE name = 'Australia'), (SELECT id FROM teams WHERE name = 'Türkiye'), 'Group Stage', '2026-06-13T19:00:00Z', 'Seattle'),
((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'Australia'), 'Group Stage', '2026-06-19T18:00:00Z', 'Seattle'),
((SELECT id FROM teams WHERE name = 'Paraguay'), (SELECT id FROM teams WHERE name = 'Türkiye'), 'Group Stage', '2026-06-19T21:00:00Z', 'San Francisco'),
((SELECT id FROM teams WHERE name = 'Türkiye'), (SELECT id FROM teams WHERE name = 'USA'), 'Group Stage', '2026-06-25T18:00:00Z', 'Los Angeles'),
((SELECT id FROM teams WHERE name = 'Paraguay'), (SELECT id FROM teams WHERE name = 'Australia'), 'Group Stage', '2026-06-25T18:00:00Z', 'Seattle');

-- Group E
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Germany'), (SELECT id FROM teams WHERE name = 'Curaçao'), 'Group Stage', '2026-06-14T22:00:00Z', 'Houston'),
((SELECT id FROM teams WHERE name = 'Côte d''Ivoire'), (SELECT id FROM teams WHERE name = 'Ecuador'), 'Group Stage', '2026-06-15T19:00:00Z', 'Dallas'),
((SELECT id FROM teams WHERE name = 'Germany'), (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'), 'Group Stage', '2026-06-20T18:00:00Z', 'Dallas'),
((SELECT id FROM teams WHERE name = 'Curaçao'), (SELECT id FROM teams WHERE name = 'Ecuador'), 'Group Stage', '2026-06-20T21:00:00Z', 'Houston'),
((SELECT id FROM teams WHERE name = 'Ecuador'), (SELECT id FROM teams WHERE name = 'Germany'), 'Group Stage', '2026-06-26T21:00:00Z', 'Dallas'),
((SELECT id FROM teams WHERE name = 'Curaçao'), (SELECT id FROM teams WHERE name = 'Côte d''Ivoire'), 'Group Stage', '2026-06-26T21:00:00Z', 'Houston');

-- Group F
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Netherlands'), (SELECT id FROM teams WHERE name = 'Japan'), 'Group Stage', '2026-06-15T22:00:00Z', 'Miami'),
((SELECT id FROM teams WHERE name = 'Sweden'), (SELECT id FROM teams WHERE name = 'Tunisia'), 'Group Stage', '2026-06-16T19:00:00Z', 'Atlanta'),
((SELECT id FROM teams WHERE name = 'Netherlands'), (SELECT id FROM teams WHERE name = 'Sweden'), 'Group Stage', '2026-06-21T18:00:00Z', 'Atlanta'),
((SELECT id FROM teams WHERE name = 'Japan'), (SELECT id FROM teams WHERE name = 'Tunisia'), 'Group Stage', '2026-06-21T21:00:00Z', 'Miami'),
((SELECT id FROM teams WHERE name = 'Tunisia'), (SELECT id FROM teams WHERE name = 'Netherlands'), 'Group Stage', '2026-06-26T18:00:00Z', 'Miami'),
((SELECT id FROM teams WHERE name = 'Japan'), (SELECT id FROM teams WHERE name = 'Sweden'), 'Group Stage', '2026-06-26T18:00:00Z', 'Atlanta');

-- Group G
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Belgium'), (SELECT id FROM teams WHERE name = 'Egypt'), 'Group Stage', '2026-06-15T01:00:00Z', 'Kansas City'),
((SELECT id FROM teams WHERE name = 'Iran'), (SELECT id FROM teams WHERE name = 'New Zealand'), 'Group Stage', '2026-06-15T15:00:00Z', 'Houston'),
((SELECT id FROM teams WHERE name = 'Belgium'), (SELECT id FROM teams WHERE name = 'Iran'), 'Group Stage', '2026-06-21T01:00:00Z', 'Kansas City'),
((SELECT id FROM teams WHERE name = 'Egypt'), (SELECT id FROM teams WHERE name = 'New Zealand'), 'Group Stage', '2026-06-21T15:00:00Z', 'Philadelphia'),
((SELECT id FROM teams WHERE name = 'New Zealand'), (SELECT id FROM teams WHERE name = 'Belgium'), 'Group Stage', '2026-06-27T21:00:00Z', 'Kansas City'),
((SELECT id FROM teams WHERE name = 'Egypt'), (SELECT id FROM teams WHERE name = 'Iran'), 'Group Stage', '2026-06-27T21:00:00Z', 'Philadelphia');

-- Group H
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Spain'), (SELECT id FROM teams WHERE name = 'Cabo Verde'), 'Group Stage', '2026-06-16T01:00:00Z', 'Seattle'),
((SELECT id FROM teams WHERE name = 'Saudi Arabia'), (SELECT id FROM teams WHERE name = 'Uruguay'), 'Group Stage', '2026-06-16T15:00:00Z', 'San Francisco'),
((SELECT id FROM teams WHERE name = 'Spain'), (SELECT id FROM teams WHERE name = 'Saudi Arabia'), 'Group Stage', '2026-06-22T01:00:00Z', 'San Francisco'),
((SELECT id FROM teams WHERE name = 'Cabo Verde'), (SELECT id FROM teams WHERE name = 'Uruguay'), 'Group Stage', '2026-06-22T15:00:00Z', 'Seattle'),
((SELECT id FROM teams WHERE name = 'Uruguay'), (SELECT id FROM teams WHERE name = 'Spain'), 'Group Stage', '2026-06-27T18:00:00Z', 'Seattle'),
((SELECT id FROM teams WHERE name = 'Cabo Verde'), (SELECT id FROM teams WHERE name = 'Saudi Arabia'), 'Group Stage', '2026-06-27T18:00:00Z', 'San Francisco');

-- Group I
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Senegal'), 'Group Stage', '2026-06-17T22:00:00Z', 'New York/NJ'),
((SELECT id FROM teams WHERE name = 'Iraq'), (SELECT id FROM teams WHERE name = 'Norway'), 'Group Stage', '2026-06-18T19:00:00Z', 'Boston'),
((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Iraq'), 'Group Stage', '2026-06-22T22:00:00Z', 'Philadelphia'),
((SELECT id FROM teams WHERE name = 'Senegal'), (SELECT id FROM teams WHERE name = 'Norway'), 'Group Stage', '2026-06-23T01:00:00Z', 'New York/NJ'),
((SELECT id FROM teams WHERE name = 'Norway'), (SELECT id FROM teams WHERE name = 'France'), 'Group Stage', '2026-06-28T21:00:00Z', 'New York/NJ'),
((SELECT id FROM teams WHERE name = 'Senegal'), (SELECT id FROM teams WHERE name = 'Iraq'), 'Group Stage', '2026-06-28T21:00:00Z', 'Boston');

-- Group J
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Algeria'), 'Group Stage', '2026-06-18T01:00:00Z', 'Los Angeles'),
((SELECT id FROM teams WHERE name = 'Austria'), (SELECT id FROM teams WHERE name = 'Jordan'), 'Group Stage', '2026-06-18T15:00:00Z', 'San Francisco'),
((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Austria'), 'Group Stage', '2026-06-23T01:00:00Z', 'Seattle'),
((SELECT id FROM teams WHERE name = 'Algeria'), (SELECT id FROM teams WHERE name = 'Jordan'), 'Group Stage', '2026-06-23T15:00:00Z', 'Los Angeles'),
((SELECT id FROM teams WHERE name = 'Jordan'), (SELECT id FROM teams WHERE name = 'Argentina'), 'Group Stage', '2026-06-28T18:00:00Z', 'Los Angeles'),
((SELECT id FROM teams WHERE name = 'Algeria'), (SELECT id FROM teams WHERE name = 'Austria'), 'Group Stage', '2026-06-28T18:00:00Z', 'Seattle');

-- Group K
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'DR Congo'), 'Group Stage', '2026-06-19T22:00:00Z', 'Houston'),
((SELECT id FROM teams WHERE name = 'Uzbekistan'), (SELECT id FROM teams WHERE name = 'Colombia'), 'Group Stage', '2026-06-20T19:00:00Z', 'Dallas'),
((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Uzbekistan'), 'Group Stage', '2026-06-24T22:00:00Z', 'Dallas'),
((SELECT id FROM teams WHERE name = 'DR Congo'), (SELECT id FROM teams WHERE name = 'Colombia'), 'Group Stage', '2026-06-25T01:00:00Z', 'Houston'),
((SELECT id FROM teams WHERE name = 'Colombia'), (SELECT id FROM teams WHERE name = 'Portugal'), 'Group Stage', '2026-06-29T21:00:00Z', 'Dallas'),
((SELECT id FROM teams WHERE name = 'DR Congo'), (SELECT id FROM teams WHERE name = 'Uzbekistan'), 'Group Stage', '2026-06-29T21:00:00Z', 'Houston');

-- Group L
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city) VALUES 
((SELECT id FROM teams WHERE name = 'England'), (SELECT id FROM teams WHERE name = 'Croatia'), 'Group Stage', '2026-06-20T22:00:00Z', 'Miami'),
((SELECT id FROM teams WHERE name = 'Ghana'), (SELECT id FROM teams WHERE name = 'Panama'), 'Group Stage', '2026-06-21T19:00:00Z', 'Atlanta'),
((SELECT id FROM teams WHERE name = 'England'), (SELECT id FROM teams WHERE name = 'Ghana'), 'Group Stage', '2026-06-25T22:00:00Z', 'Atlanta'),
((SELECT id FROM teams WHERE name = 'Croatia'), (SELECT id FROM teams WHERE name = 'Panama'), 'Group Stage', '2026-06-26T01:00:00Z', 'Miami'),
((SELECT id FROM teams WHERE name = 'Panama'), (SELECT id FROM teams WHERE name = 'England'), 'Group Stage', '2026-06-29T18:00:00Z', 'Miami'),
((SELECT id FROM teams WHERE name = 'Croatia'), (SELECT id FROM teams WHERE name = 'Ghana'), 'Group Stage', '2026-06-29T18:00:00Z', 'Atlanta');
