"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar, Clock, User, ArrowRight, BookOpen, Heart, Search, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { toast } from "sonner"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string
  read_time_minutes: number
  views_count: number
  likes_count: number
  is_featured: boolean
  published_at: string
  tags: string[]
  blog_authors: {
    name: string
    avatar_url: string
  }
  blog_categories: {
    name: string
    slug: string
    color: string
  }
}

interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [newsletterEmail, setNewsletterEmail] = useState("")
  const [newsletterLoading, setNewsletterLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    fetchCategories()
    fetchPosts()
  }, [])

  useEffect(() => {
    fetchPosts()
  }, [selectedCategory, searchQuery])

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/blog/categories")
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchPosts = async (pageNum = 1, append = false) => {
    try {
      setLoading(!append)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "9",
      })

      if (selectedCategory !== "all") {
        params.append("category", selectedCategory)
      }

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/blog/posts?${params}`)
      const data = await response.json()

      if (data.posts) {
        if (append) {
          setPosts((prev) => [...prev, ...data.posts])
        } else {
          setPosts(data.posts)
          // Set featured post from the first post if it's featured
          const featured = data.posts.find((post: BlogPost) => post.is_featured)
          setFeaturedPost(featured || data.posts[0] || null)
        }

        setHasMore(pageNum < data.pagination.totalPages)
        setPage(pageNum)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      toast.error("Failed to load blog posts")
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = () => {
    fetchPosts(page + 1, true)
  }

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newsletterEmail) return

    setNewsletterLoading(true)
    try {
      const response = await fetch("/api/blog/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(data.message)
        setNewsletterEmail("")

        // Track newsletter signup
        await fetch("/api/blog/analytics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "newsletter_signup",
            data: { email: newsletterEmail },
          }),
        })
      } else {
        toast.error(data.error || "Failed to subscribe")
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error)
      toast.error("Failed to subscribe. Please try again.")
    } finally {
      setNewsletterLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const allCategories = [{ name: "All", slug: "all", color: "#6366f1" }, ...categories]

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-b from-background to-primary/5">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-rose-500/10" />
          <div className="container px-4 md:px-6 relative">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-rose-600 bg-clip-text text-transparent">
                Spiritual Blog
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Wisdom, insights, and guidance for your journey of conscious love and spiritual partnership
              </p>
            </div>
          </div>
        </section>

        {/* Search and Categories */}
        <section className="py-8 border-b">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Search */}
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Categories */}
              <div className="flex flex-wrap gap-2 justify-center">
                {allCategories.map((category) => (
                  <Badge
                    key={category.slug}
                    variant={category.slug === selectedCategory ? "default" : "secondary"}
                    className="cursor-pointer hover:bg-primary hover:text-white transition-colors"
                    style={{
                      backgroundColor: category.slug === selectedCategory ? category.color : undefined,
                    }}
                    onClick={() => setSelectedCategory(category.slug)}
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-16 md:py-24">
            <div className="container px-4 md:px-6">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Article</h2>
                  <p className="text-xl text-muted-foreground">
                    Our most popular spiritual wisdom for conscious relationships
                  </p>
                </div>

                <Card className="border-0 shadow-2xl overflow-hidden bg-gradient-to-br from-white to-primary/5">
                  <div className="md:flex">
                    <div className="md:w-1/2">
                      <Image
                        src={
                          featuredPost.featured_image_url ||
                          "/placeholder.svg?height=400&width=600&text=Featured+Article"
                        }
                        alt={featuredPost.title}
                        width={600}
                        height={400}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    </div>
                    <div className="md:w-1/2 p-8 md:p-12">
                      <Badge className="mb-4" style={{ backgroundColor: featuredPost.blog_categories.color }}>
                        {featuredPost.blog_categories.name}
                      </Badge>
                      <h3 className="text-2xl md:text-3xl font-bold mb-4">{featuredPost.title}</h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {featuredPost.blog_authors.name}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(featuredPost.published_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {featuredPost.read_time_minutes} min read
                        </div>
                      </div>
                      <Link href={`/blog/${featuredPost.slug}`}>
                        <Button className="bg-primary hover:bg-primary/90">
                          Read Full Article
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Blog Posts Grid */}
        <section className="py-16 md:py-24 bg-gradient-to-b from-transparent to-primary/5">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Latest Articles</h2>
                <p className="text-xl text-muted-foreground">Fresh insights for your spiritual journey</p>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {posts
                      .filter((post) => !post.is_featured || post.id !== featuredPost?.id)
                      .map((post) => (
                        <Card
                          key={post.id}
                          className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                        >
                          <div className="relative overflow-hidden">
                            <Image
                              src={post.featured_image_url || "/placeholder.svg?height=250&width=400&text=Blog+Post"}
                              alt={post.title}
                              width={400}
                              height={250}
                              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            <Badge
                              className="absolute top-4 left-4"
                              style={{ backgroundColor: post.blog_categories.color }}
                            >
                              {post.blog_categories.name}
                            </Badge>
                          </div>
                          <CardContent className="p-6">
                            <h3 className="text-xl font-semibold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                              {post.title}
                            </h3>
                            <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {post.blog_authors.name}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {post.read_time_minutes} min read
                              </div>
                            </div>
                            <Link href={`/blog/${post.slug}`}>
                              <Button
                                variant="ghost"
                                className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
                              >
                                Read More
                                <ArrowRight className="ml-1 h-4 w-4" />
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      ))}
                  </div>

                  {hasMore && (
                    <div className="text-center mt-12">
                      <Button
                        onClick={handleLoadMore}
                        variant="outline"
                        className="bg-white hover:bg-primary hover:text-white"
                      >
                        Load More Articles
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>

        {/* Newsletter Signup */}
        <section className="py-16 md:py-24 bg-gradient-to-r from-primary/10 to-rose-500/10">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <div className="inline-flex items-center justify-center p-3 bg-primary/10 rounded-full mb-6">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold">Stay Connected to Sacred Wisdom</h2>
              <p className="text-xl text-muted-foreground">
                Receive our latest articles and spiritual insights directly in your inbox
              </p>
              <form
                onSubmit={handleNewsletterSubmit}
                className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto"
              >
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  required
                  className="flex-1"
                />
                <Button type="submit" disabled={newsletterLoading} className="bg-primary hover:bg-primary/90">
                  {newsletterLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Subscribing...
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
