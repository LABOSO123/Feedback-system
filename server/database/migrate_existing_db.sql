-- Migration script to update existing database to match expected schema
-- Run this script if you already have tables but they're missing columns or tables

-- ============================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add updated_at to users table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add updated_at to teams table (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teams' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE teams ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add missing columns to dashboards table
DO $$ 
BEGIN
    -- Add assigned_team_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dashboards' AND column_name = 'assigned_team_id'
    ) THEN
        ALTER TABLE dashboards ADD COLUMN assigned_team_id INTEGER;
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'dashboards' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE dashboards ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add missing columns to charts table
DO $$ 
BEGIN
    -- Add created_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'charts' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE charts ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'charts' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE charts ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add missing columns to issues table
DO $$ 
BEGIN
    -- Add subject if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'subject'
    ) THEN
        ALTER TABLE issues ADD COLUMN subject VARCHAR(255);
    END IF;
    
    -- Add attachment_url if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'issues' AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE issues ADD COLUMN attachment_url VARCHAR(500);
    END IF;
END $$;

-- Add missing columns to comments table
DO $$ 
BEGIN
    -- Add attachment_url if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'attachment_url'
    ) THEN
        ALTER TABLE comments ADD COLUMN attachment_url VARCHAR(500);
    END IF;
    
    -- Add updated_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- ============================================
-- 2. RENAME issue_seconds TO thread_seconds
-- ============================================

DO $$ 
BEGIN
    -- Check if issue_seconds exists and thread_seconds doesn't
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'issue_seconds'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'thread_seconds'
    ) THEN
        ALTER TABLE issue_seconds RENAME TO thread_seconds;
    END IF;
END $$;

-- ============================================
-- 3. CREATE MISSING TABLES
-- ============================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    issue_id INTEGER,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin requests table
CREATE TABLE IF NOT EXISTS admin_requests (
    id SERIAL PRIMARY KEY,
    submitted_by_user_id INTEGER NOT NULL,
    request_type VARCHAR(100) NOT NULL,
    dashboard_id INTEGER,
    team_id INTEGER,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'rejected')),
    admin_response TEXT,
    resolved_by_admin_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 4. ADD FOREIGN KEY CONSTRAINTS
-- ============================================

-- Users to Teams
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_users_team'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT fk_users_team 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Dashboards foreign keys
DO $$ 
BEGIN
    -- created_by_admin_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dashboards_created_by'
    ) THEN
        ALTER TABLE dashboards ADD CONSTRAINT fk_dashboards_created_by 
        FOREIGN KEY (created_by_admin_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
    
    -- assigned_team_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_dashboards_assigned_team'
    ) THEN
        ALTER TABLE dashboards ADD CONSTRAINT fk_dashboards_assigned_team 
        FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Charts foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_charts_dashboard'
    ) THEN
        ALTER TABLE charts ADD CONSTRAINT fk_charts_dashboard 
        FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Issues foreign keys
DO $$ 
BEGIN
    -- dashboard_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_issues_dashboard'
    ) THEN
        ALTER TABLE issues ADD CONSTRAINT fk_issues_dashboard 
        FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE CASCADE;
    END IF;
    
    -- chart_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_issues_chart'
    ) THEN
        ALTER TABLE issues ADD CONSTRAINT fk_issues_chart 
        FOREIGN KEY (chart_id) REFERENCES charts(id) ON DELETE SET NULL;
    END IF;
    
    -- submitted_by_user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_issues_submitted_by'
    ) THEN
        ALTER TABLE issues ADD CONSTRAINT fk_issues_submitted_by 
        FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- assigned_team_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_issues_assigned_team'
    ) THEN
        ALTER TABLE issues ADD CONSTRAINT fk_issues_assigned_team 
        FOREIGN KEY (assigned_team_id) REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
    
    -- assigned_user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_issues_assigned_user'
    ) THEN
        ALTER TABLE issues ADD CONSTRAINT fk_issues_assigned_user 
        FOREIGN KEY (assigned_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Comments foreign keys
DO $$ 
BEGIN
    -- issue_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_comments_issue'
    ) THEN
        ALTER TABLE comments ADD CONSTRAINT fk_comments_issue 
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE;
    END IF;
    
    -- user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_comments_user'
    ) THEN
        ALTER TABLE comments ADD CONSTRAINT fk_comments_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Thread seconds foreign keys
DO $$ 
BEGIN
    -- issue_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_thread_seconds_issue'
    ) THEN
        ALTER TABLE thread_seconds ADD CONSTRAINT fk_thread_seconds_issue 
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE;
    END IF;
    
    -- user_id
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_thread_seconds_user'
    ) THEN
        ALTER TABLE thread_seconds ADD CONSTRAINT fk_thread_seconds_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add UNIQUE constraint if not exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'thread_seconds_issue_id_user_id_key'
    ) THEN
        ALTER TABLE thread_seconds ADD CONSTRAINT thread_seconds_issue_id_user_id_key 
        UNIQUE(issue_id, user_id);
    END IF;
END $$;

-- Teams foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_teams_lead'
    ) THEN
        ALTER TABLE teams ADD CONSTRAINT fk_teams_lead 
        FOREIGN KEY (team_lead_user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Notifications foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_notifications_user'
    ) THEN
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_notifications_issue'
    ) THEN
        ALTER TABLE notifications ADD CONSTRAINT fk_notifications_issue 
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Leaderboard activity foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_leaderboard_user'
    ) THEN
        ALTER TABLE leaderboard_activity ADD CONSTRAINT fk_leaderboard_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_leaderboard_issue'
    ) THEN
        ALTER TABLE leaderboard_activity ADD CONSTRAINT fk_leaderboard_issue 
        FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Password reset tokens foreign key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_password_reset_user'
    ) THEN
        ALTER TABLE password_reset_tokens ADD CONSTRAINT fk_password_reset_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Admin requests foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_requests_submitted_by'
    ) THEN
        ALTER TABLE admin_requests ADD CONSTRAINT fk_admin_requests_submitted_by 
        FOREIGN KEY (submitted_by_user_id) REFERENCES users(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_requests_dashboard'
    ) THEN
        ALTER TABLE admin_requests ADD CONSTRAINT fk_admin_requests_dashboard 
        FOREIGN KEY (dashboard_id) REFERENCES dashboards(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_requests_team'
    ) THEN
        ALTER TABLE admin_requests ADD CONSTRAINT fk_admin_requests_team 
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_admin_requests_resolved_by'
    ) THEN
        ALTER TABLE admin_requests ADD CONSTRAINT fk_admin_requests_resolved_by 
        FOREIGN KEY (resolved_by_admin_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 5. ADD INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_issues_dashboard_id ON issues(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_team_id ON issues(assigned_team_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_submitted_by ON issues(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_thread_seconds_issue_id ON thread_seconds(issue_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_submitted_by ON admin_requests(submitted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_requests_status ON admin_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_requests_type ON admin_requests(request_type);

-- ============================================
-- 6. CREATE TRIGGER FUNCTION AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dashboards_updated_at ON dashboards;
CREATE TRIGGER update_dashboards_updated_at BEFORE UPDATE ON dashboards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_charts_updated_at ON charts;
CREATE TRIGGER update_charts_updated_at BEFORE UPDATE ON charts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_requests_updated_at ON admin_requests;
CREATE TRIGGER update_admin_requests_updated_at BEFORE UPDATE ON admin_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICATION QUERIES (run these to check)
-- ============================================

-- List all tables
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- Check table structures
-- \d users
-- \d teams
-- \d dashboards
-- \d charts
-- \d issues
-- \d comments
-- \d thread_seconds
-- \d notifications
-- \d leaderboard_activity
-- \d password_reset_tokens
-- \d admin_requests


