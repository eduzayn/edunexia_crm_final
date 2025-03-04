-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('admin', 'agent', 'customer');
CREATE TYPE conversation_status AS ENUM ('open', 'resolved', 'pending');
CREATE TYPE conversation_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE conversation_source AS ENUM ('chat', 'email', 'whatsapp', 'facebook', 'twitter', 'instagram', 'telegram', 'slack', 'discord');
CREATE TYPE message_sender_type AS ENUM ('user', 'contact');
CREATE TYPE message_content_type AS ENUM ('text', 'image', 'video', 'audio', 'file');
CREATE TYPE integration_provider AS ENUM ('whatsapp', 'facebook', 'twitter', 'instagram', 'telegram', 'slack', 'discord');
CREATE TYPE integration_status AS ENUM ('active', 'inactive', 'error');
CREATE TYPE report_type AS ENUM ('conversation', 'agent', 'contact', 'custom');
CREATE TYPE report_execution_status AS ENUM ('pending', 'running', 'completed', 'failed');

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
);

-- Create user_settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_preferences JSONB NOT NULL DEFAULT '{"email": true, "push": true, "desktop": true}',
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    domain TEXT,
    logo_url TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    inbox_id UUID NOT NULL REFERENCES inboxes(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    status conversation_status NOT NULL DEFAULT 'open',
    priority conversation_priority NOT NULL DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source conversation_source NOT NULL DEFAULT 'chat',
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_type message_sender_type NOT NULL,
    sender_id UUID NOT NULL,
    content TEXT NOT NULL,
    content_type message_content_type NOT NULL DEFAULT 'text',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create contacts table
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    email TEXT,
    phone TEXT,
    name TEXT NOT NULL,
    avatar_url TEXT,
    custom_attributes JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'
);

-- Create inboxes table
CREATE TABLE inboxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    channel_type conversation_source NOT NULL,
    channel_id TEXT,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create integrations table
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider integration_provider NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    status integration_status NOT NULL DEFAULT 'inactive',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type report_type NOT NULL,
    parameters JSONB NOT NULL DEFAULT '{}',
    schedule JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create report_executions table
CREATE TABLE report_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    status report_execution_status NOT NULL DEFAULT 'pending',
    data JSONB,
    error TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX idx_users_account_id ON users(account_id);
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_teams_account_id ON teams(account_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_conversations_account_id ON conversations(account_id);
CREATE INDEX idx_conversations_inbox_id ON conversations(inbox_id);
CREATE INDEX idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_contacts_account_id ON contacts(account_id);
CREATE INDEX idx_inboxes_account_id ON inboxes(account_id);
CREATE INDEX idx_integrations_account_id ON integrations(account_id);
CREATE INDEX idx_reports_account_id ON reports(account_id);
CREATE INDEX idx_report_executions_report_id ON report_executions(report_id);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inboxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can view their own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Create policies for user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for accounts
CREATE POLICY "Users can view their account data" ON accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.account_id = accounts.id
            AND users.id = auth.uid()
        )
    );

-- Create policies for teams
CREATE POLICY "Users can view teams in their account" ON teams
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.account_id = teams.account_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for team_members
CREATE POLICY "Users can view team members in their teams" ON team_members
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM teams
            JOIN users ON users.account_id = teams.account_id
            WHERE teams.id = team_members.team_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for conversations
CREATE POLICY "Users can view conversations in their account" ON conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.account_id = conversations.account_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for messages
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            JOIN users ON users.account_id = conversations.account_id
            WHERE conversations.id = messages.conversation_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for contacts
CREATE POLICY "Users can view contacts in their account" ON contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.account_id = contacts.account_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for inboxes
CREATE POLICY "Users can view inboxes in their account" ON inboxes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.account_id = inboxes.account_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for integrations
CREATE POLICY "Users can view integrations in their account" ON integrations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.account_id = integrations.account_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for reports
CREATE POLICY "Users can view reports in their account" ON reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.account_id = reports.account_id
            AND users.id = auth.uid()
        )
    );

-- Create policies for report_executions
CREATE POLICY "Users can view report executions in their account" ON report_executions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reports
            JOIN users ON users.account_id = reports.account_id
            WHERE reports.id = report_executions.report_id
            AND users.id = auth.uid()
        )
    );

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at
    BEFORE UPDATE ON team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at
    BEFORE UPDATE ON contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inboxes_updated_at
    BEFORE UPDATE ON inboxes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_report_executions_updated_at
    BEFORE UPDATE ON report_executions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 