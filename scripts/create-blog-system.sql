-- Create blog categories table
CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog authors table
CREATE TABLE IF NOT EXISTS blog_authors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    featured_image_url TEXT,
    author_id UUID REFERENCES blog_authors(id) ON DELETE SET NULL,
    category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_featured BOOLEAN DEFAULT false,
    read_time_minutes INTEGER DEFAULT 5,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    meta_title VARCHAR(255),
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog newsletter subscribers table
CREATE TABLE IF NOT EXISTS blog_newsletter_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB DEFAULT '{"frequency": "weekly", "topics": []}'
);

-- Create blog post views table for analytics
CREATE TABLE IF NOT EXISTS blog_post_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blog post likes table
CREATE TABLE IF NOT EXISTS blog_post_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    liked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(is_featured);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_viewed_at ON blog_post_views(viewed_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();
CREATE TRIGGER update_blog_authors_updated_at BEFORE UPDATE ON blog_authors FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_blog_updated_at_column();

-- Function to increment post views
CREATE OR REPLACE FUNCTION increment_post_views(post_uuid UUID)
RETURNS void AS $$
BEGIN
    UPDATE blog_posts 
    SET views_count = views_count + 1 
    WHERE id = post_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular posts
CREATE OR REPLACE FUNCTION get_popular_posts(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    slug VARCHAR,
    excerpt TEXT,
    featured_image_url TEXT,
    author_name VARCHAR,
    category_name VARCHAR,
    views_count INTEGER,
    published_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.featured_image_url,
        ba.name as author_name,
        bc.name as category_name,
        bp.views_count,
        bp.published_at
    FROM blog_posts bp
    LEFT JOIN blog_authors ba ON bp.author_id = ba.id
    LEFT JOIN blog_categories bc ON bp.category_id = bc.id
    WHERE bp.status = 'published'
    ORDER BY bp.views_count DESC, bp.published_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
