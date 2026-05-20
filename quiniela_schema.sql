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
