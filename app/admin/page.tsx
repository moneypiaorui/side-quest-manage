"use client"

import useSWR from "swr"
import { getDashboardStats, getTopPosts, type DashboardStats, type TopPost } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Users, FileText, MessageSquare, Heart, Clock, TrendingUp, Eye, ThumbsUp } from "lucide-react"

const statsFetcher = async () => {
  const result = await getDashboardStats()
  if (result.code === 200) return result.data
  throw new Error(result.message)
}

const topPostsFetcher = async () => {
  const result = await getTopPosts()
  if (result.code === 200) return result.data
  throw new Error(result.message)
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useSWR<DashboardStats>("dashboard-stats", statsFetcher)
  const { data: topPosts, isLoading: topPostsLoading } = useSWR<TopPost[]>("top-posts", topPostsFetcher)

  const statCards = [
    { label: "总用户数", value: stats?.totalUsers, icon: Users, color: "text-blue-600" },
    { label: "总帖子数", value: stats?.totalPosts, icon: FileText, color: "text-green-600" },
    { label: "总评论数", value: stats?.totalComments, icon: MessageSquare, color: "text-orange-600" },
    { label: "总点赞数", value: stats?.totalLikes, icon: Heart, color: "text-red-600" },
    { label: "待审核帖子", value: stats?.pendingPosts, icon: Clock, color: "text-yellow-600" },
    { label: "活跃用户", value: stats?.activeUsers, icon: TrendingUp, color: "text-purple-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">查看系统整体运行状态和数据概览</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value !== undefined ? stat.value.toLocaleString() : "-"}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            热门帖子榜
          </CardTitle>
          <CardDescription>按互动量排序的热门内容</CardDescription>
        </CardHeader>
        <CardContent>
          {topPostsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : topPosts && topPosts.length > 0 ? (
            <div className="space-y-4">
              {topPosts.slice(0, 10).map((post, index) => (
                <div key={post.id || index} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title || "无标题"}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.viewCount?.toLocaleString() || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {post.likeCount?.toLocaleString() || 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">暂无热门帖子数据</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
