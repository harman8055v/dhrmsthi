"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, User, ArrowRight, Heart, Eye, Share2, Loader2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import Footer from "@/components/footer"
import { toast } from "sonner"

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string
  read_time_minutes: number
  views_count: number
  likes_count: number
  published_at: string
  tags: string[]
  meta_title?: string
  meta_description?: string
  blog_authors: {
    name: string
    bio: string
    avatar_url: string
  }
  blog_categories: {
    name: string
    slug: string
    color: string
  }
}

interface RelatedPost {
  id: string
  title: string
  slug: string
  excerpt: string
  featured_image_url: string
  read_time_minutes: number
  published_at: string
  blog_authors: {
    name: string
  }
  blog_categories: {
    name: string
    color: string
  }
}

export default function BlogPostPage() {
  const params = useParams()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [relatedPosts, setRelatedPosts] = useState<RelatedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (slug) {
      fetchPost()
    }
  }, [slug])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/blog/posts/${slug}`)

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Blog post not found")
        } else {
          toast.error("Failed to load blog post")
        }
        return
      }

      const data = await response.json()
      setPost(data.post)
      setRelatedPosts(data.relatedPosts || [])

      // Track page view
      await fetch("/api/blog/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "page_view",
          data: { post_id: data.post.id, slug },
        }),
      })
    } catch (error) {
      console.error("Error fetching post:", error)
      toast.error("Failed to load blog post")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
      } catch (error) {
        // Fallback to copying URL
        copyToClipboard()
      }
    } else {
      copyToClipboard()
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Link copied to clipboard!")
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-6 mt-8">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mb-4 mt-6">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium mb-3 mt-4">$1</h3>')
      .replace(/^\*\*(.*)\*\*/gim, "<strong>$1</strong>")
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Blog post not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen pt-14">
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{formatDate(post.published_at)}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{post.read_time_minutes} min read</p>
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
              <div className="flex items-center space-x-4 mb-8">
                {post.blog_authors.map((author) => (
                  <div key={author.name} className="flex items-center space-x-2">
                    <Image
                      src={author.avatar_url || "/placeholder.svg"}
                      alt={author.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <p className="text-sm font-medium">{author.name}</p>
                  </div>
                ))}
              </div>
              <div className="mb-8">
                <Image
                  src={post.featured_image_url || "/placeholder.svg"}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="rounded-lg"
                />
              </div>
              <div dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />
              <div className="flex items-center justify-between mt-8">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{post.views_count} views</p>
                </div>
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{post.likes_count} likes</p>
                </div>
                <Button onClick={handleShare} className="flex items-center space-x-2">
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="flex flex-wrap -mx-4">
            {relatedPosts.map((post) => (
              <div key={post.id} className="w-full md:w-1/2 px-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-2xl font-bold mb-4">{post.title}</h2>
                    <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                    <div className="flex items-center space-x-4">
                      {post.blog_authors.map((author) => (
                        <div key={author.name} className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <p className="text-sm font-medium">{author.name}</p>
                        </div>
                      ))}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{formatDate(post.published_at)}</p>
                      </div>
                    </div>
                    <Link href={`/blog/${post.slug}`} className="flex items-center space-x-2 mt-4">
                      <span>Read more</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
