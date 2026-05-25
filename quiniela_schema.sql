-- Quiniela WC 2026 Schema (OFFICIAL)

-- 1. Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    draft_order INTEGER NOT NULL,
    secret_token UUID DEFAULT gen_random_uuid() UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Teams Table (Official 48 Nations + Groups)
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    group_letter CHAR(1) NOT NULL,
    flag_emoji TEXT,
    is_picked BOOLEAN DEFAULT FALSE,
    picked_by_id UUID REFERENCES players(id),
    pick_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Draft State
CREATE TABLE IF NOT EXISTS draft_state (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    current_pick_number INTEGER DEFAULT 1,
    is_draft_active BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scoring Configuration
CREATE TABLE IF NOT EXISTS scoring_config (
    id SERIAL PRIMARY KEY,
    rule_name TEXT NOT NULL UNIQUE,
    points_value INTEGER NOT NULL,
    description TEXT
);

-- SEED DATA
INSERT INTO players (name, draft_order) VALUES 
('Emanuel', 1), ('Obi-Wan', 2), ('Ruthy', 3), ('Daniel', 4);

INSERT INTO draft_state (id, current_pick_number) VALUES (1, 1);

INSERT INTO scoring_config (rule_name, points_value, description) VALUES
('group_1st', 5, '1st in group'),
('group_2nd', 3, '2nd in group'),
('group_3rd_adv', 1, '3rd and advancing'),
('not_advancing', -3, 'Failed to reach R32'),
('knockout_win', 4, 'Win in any knockout round'),
('final_win', 10, 'WC Champion');

-- SEED OFFICIAL 48 TEAMS (Groups A-L)
INSERT INTO teams (name, group_letter, flag_emoji) VALUES
-- Group A
('Mexico', 'A', '🇲🇽'), ('South Africa', 'A', '🇿🇦'), ('South Korea', 'A', '🇰🇷'), ('Czechia', 'A', '🇨🇿'),
-- Group B
('Canada', 'B', '🇨🇦'), ('Bosnia and Herzegovina', 'B', '🇧🇦'), ('Qatar', 'B', '🇶🇦'), ('Switzerland', 'B', '🇨🇭'),
-- Group C
('Brazil', 'C', '🇧🇷'), ('Morocco', 'C', '🇲🇦'), ('Haiti', 'C', '🇭🇹'), ('Scotland', 'C', '🏴󠁧󠁢󠁳󠁣󠁴󠁿'),
-- Group D
('USA', 'D', '🇺🇸'), ('Paraguay', 'D', '🇵🇾'), ('Australia', 'D', '🇦🇺'), ('Türkiye', 'D', '🇹🇷'),
-- Group E
('Germany', 'E', '🇩🇪'), ('Curaçao', 'E', '🇨🇼'), ('Côte d''Ivoire', 'E', '🇨🇮'), ('Ecuador', 'E', '🇪🇨'),
-- Group F
('Netherlands', 'F', '🇳🇱'), ('Japan', 'F', '🇯🇵'), ('Sweden', 'F', '🇸🇪'), ('Tunisia', 'F', '🇹🇳'),
-- Group G
('Belgium', 'G', '🇧🇪'), ('Egypt', 'G', '🇪🇬'), ('Iran', 'G', '🇮🇷'), ('New Zealand', 'G', '🇳🇿'),
-- Group H
('Spain', 'H', '🇪🇸'), ('Cabo Verde', 'H', '🇨🇻'), ('Saudi Arabia', 'H', '🇸🇦'), ('Uruguay', 'H', '🇺🇾'),
-- Group I
('France', 'I', '🇫🇷'), ('Senegal', 'I', '🇸🇳'), ('Iraq', 'I', '🇮🇶'), ('Norway', 'I', '🇳🇴'),
-- Group J
('Argentina', 'J', '🇦🇷'), ('Algeria', 'J', '🇩🇿'), ('Austria', 'J', '🇦🇹'), ('Jordan', 'J', '🇯🇴'),
-- Group K
('Portugal', 'K', '🇵🇹'), ('DR Congo', 'K', '🇨🇩'), ('Uzbekistan', 'K', '🇺🇿'), ('Colombia', 'K', '🇨🇴'),
-- Group L
('England', 'L', '🏴󠁧󠁢󠁥󠁮󠁧󠁿'), ('Croatia', 'L', '🇭🇷'), ('Ghana', 'L', '🇬🇭'), ('Panama', 'L', '🇵🇦');

-- DRAFT TURN LOGIC FUNCTION
CREATE OR REPLACE FUNCTION get_current_player_turn(pick_num INTEGER) 
RETURNS UUID AS $$
DECLARE
    round_num INTEGER;
    position_in_round INTEGER;
    target_order INTEGER;
BEGIN
    round_num := ((pick_num - 1) / 4) + 1;
    position_in_round := ((pick_num - 1) % 4) + 1;
    
    IF round_num % 2 = 1 THEN
        target_order := position_in_round;
    ELSE
        target_order := 5 - position_in_round;
    END IF;

    RETURN (SELECT id FROM players WHERE draft_order = target_order);
END;
$$ LANGUAGE plpgsql;

-- 1. Table for Wildcard Picks (Free Choice)
CREATE TABLE IF NOT EXISTS wildcard_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES players(id) ON DELETE CASCADE,
    golden_boot_name TEXT,
    golden_glove_name TEXT,
    mvp_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id)
);

-- 2. Table for Final Wildcard Winners (Admin set)
CREATE TABLE IF NOT EXISTS wildcard_winners (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    golden_boot TEXT,
    golden_glove TEXT,
    mvp TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initialize the winners row
INSERT INTO wildcard_winners (id) VALUES (1) ON CONFLICT DO NOTHING;

-- 3. Ensure scoring_config has all categories
INSERT INTO scoring_config (rule_name, points_value, description) VALUES
('group_3rd_no_adv', -5, 'Penalty for 3rd place not advancing (Failure)'),
('r32_win', 10, 'Win in Round of 32'),
('r16_win', 20, 'Win in Round of 16'),
('qf_win', 40, 'Win in Quarter-finals'),
('sf_win', 80, 'Win in Semi-finals'),
('wildcard_correct', 20, 'Correct wildcard pick'),
('wildcard_sole_winner', 40, 'Only player to guess correctly')
ON CONFLICT (rule_name) DO NOTHING;

-- 1. Remove the redundant generic knockout rule
DELETE FROM scoring_config WHERE rule_name = 'knockout_win';

-- 2. Clean up and rename the negative point rules
DELETE FROM scoring_config WHERE rule_name IN ('not_advancing', 'group_3rd_no_adv');


-- The "Final 155" Scoring Logic
INSERT INTO scoring_config (rule_name, points_value, description) VALUES
('group_1st', 10, 'Team finishes 1st in Group Stage'),
('group_2nd', 7, 'Team finishes 2nd in Group Stage'),
('group_3rd_adv', 5, 'Team finishes 3rd and Advances'),
('not_advancing_3rd', -3, 'Team finishes 3rd and fails to advance'),
('not_advancing_4th', -5, 'Team finishes 4th (Group Bottom)'),
('r32_win', 15, 'Win in Round of 32'),
('r16_win', 20, 'Win in Round of 16'),
('qf_win', 25, 'Win in Quarter-finals'),
('sf_win', 35, 'Win in Semi-finals'),
('final_win', 50, 'World Cup Champion (Total 155)'),
('wildcard_correct', 15, 'Correct wildcard prediction'),
('wildcard_sole_winner', 30, 'Sole correct wildcard prediction')
ON CONFLICT (rule_name) DO UPDATE SET
    points_value = EXCLUDED.points_value,
    description = EXCLUDED.description;

 -- 1. Create Matches Table
 CREATE TABLE IF NOT EXISTS matches (
     id SERIAL PRIMARY KEY,
     team_a_id INTEGER REFERENCES teams(id),
     team_b_id INTEGER REFERENCES teams(id),
     stage TEXT NOT NULL, -- e.g., 'Group Stage', 'Round of 32', 'Quarter-finals'
     kickoff_time TIMESTAMPTZ NOT NULL,
     venue_city TEXT,
     status TEXT DEFAULT 'scheduled', -- 'scheduled', 'live', 'finished'
     score_a INTEGER DEFAULT 0,
     score_b INTEGER DEFAULT 0,
     created_at TIMESTAMPTZ DEFAULT NOW()
 );


-- 2. Seed some Mock Matches for testing
INSERT INTO matches (team_a_id, team_b_id, stage, kickoff_time, venue_city, status)
VALUES
((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'South Africa'), 'Group A', '2026-06-11 15:00:00+00', 'Mexico City', 'scheduled'),
((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'Paraguay'), 'Group D', '2026-06-12 18:00:00+00', 'Los Angeles', 'scheduled');

 -- 1. Add the column
 ALTER TABLE matches ADD COLUMN IF NOT EXISTS round INTEGER;
-- 2. Wipe old matches to prevent errors
TRUNCATE TABLE matches CASCADE;