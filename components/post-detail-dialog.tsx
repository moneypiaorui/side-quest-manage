"use client"

import type { PostDO } from "@/lib/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Eye, Heart, MessageSquare, Star, Calendar, User, ImageIcon, Video, Tag } from "lucide-react"

interface PostDetailDialogProps {
  post: PostDO | null
  onClose: () => void
}

const STATUS_MAP: Record<number, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  0: { label: "待审核", variant: "secondary" },
  1: { label: "已通过", variant: "default" },
  2: { label: "已拒绝", variant: "destructive" },
}

export function PostDetailDialog({ post, onClose }: PostDetailDialogProps) {
  if (!post) return null

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  const parseImages = (imageUrls: string) => {
    if (!imageUrls) return []
    try {
      return JSON.parse(imageUrls)
    } catch {
      return imageUrls.split(",").filter(Boolean)
    }
  }

  const parseTags = (tags: string) => {
    if (!tags) return []
    try {
      return JSON.parse(tags)
    } catch {
      return tags.split(",").filter(Boolean)
    }
  }

  const images = parseImages(post.imageUrls)
  const tags = parseTags(post.tags)

  return (
    <Dialog open={!!post} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="text-xl">{post.title}</DialogTitle>
            <Badge variant={STATUS_MAP[post.status]?.variant || "outline"}>
              {STATUS_MAP[post.status]?.label || "未知"}
            </Badge>
          </div>
          <DialogDescription className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {post.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.createTime)}
            </span>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {post.viewCount} 浏览
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {post.likeCount} 点赞
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {post.commentCount} 评论
              </span>
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4" />
                {post.favoriteCount} 收藏
              </span>
            </div>

            <Separator />

            {/* Content */}
            <div>
              <h4 className="text-sm font-medium mb-2">内容</h4>
              <div className="rounded-lg bg-muted p-4 text-sm whitespace-pre-wrap">{post.content}</div>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Tag className="h-4 w-4" />
                  标签
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Images */}
            {images.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <ImageIcon className="h-4 w-4" />
                  图片 ({images.length})
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((url: string, index: number) => (
                    <a
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="aspect-square rounded-lg bg-muted overflow-hidden hover:opacity-80 transition-opacity"
                    >
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`图片 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Video */}
            {post.videoUrl && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <Video className="h-4 w-4" />
                  视频
                </h4>
                <div className="rounded-lg bg-muted p-4">
                  <a
                    href={post.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm break-all"
                  >
                    {post.videoUrl}
                  </a>
                  {post.videoDuration && (
                    <p className="text-sm text-muted-foreground mt-1">
                      时长: {Math.floor(post.videoDuration / 60)}:{String(post.videoDuration % 60).padStart(2, "0")}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Meta Info */}
            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>帖子 ID: {post.id}</p>
              <p>作者 ID: {post.authorId}</p>
              <p>分区 ID: {post.sectionId}</p>
              <p>更新时间: {formatDate(post.updateTime)}</p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
