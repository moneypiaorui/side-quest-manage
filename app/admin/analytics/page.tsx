"use client"

import useSWR from "swr"
import { getDashboardStats, getTopPosts, type DashboardStats, type TopPost } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, Users, BarChart3, Eye } from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

const statsFetcher = async (): Promise<DashboardStats | null> => {
  const result = await getDashboardStats()
  return result.code === 200 ? result.data : null
}

const topPostsFetcher = async (): Promise<TopPost[]> => {
  const result = await getTopPosts()
  return result.code === 200 ? result.data || [] : []
}

export default function AnalyticsPage() {
  const { data: stats, isLoading: statsLoading } = useSWR("analytics-stats", statsFetcher)
  const { data: topPosts, isLoading: topPostsLoading } = useSWR("analytics-top-posts", topPostsFetcher)

  const totalUsers = stats?.totalUsers ?? 0
  const activeUsers = stats?.activeUsers24h ?? stats?.activeUsers ?? 0
  const totalEvents = stats?.totalEvents ?? 0
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const topPostsChart = (topPosts || []).map((post, index) => ({
    name: post.title || `#${post.postId ?? post.id ?? index + 1}`,
    views: post.viewCount ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">数据分析</h1>
        <p className="text-muted-foreground">聚合行为事件与热点内容，辅助运营决策</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">事件总量</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{totalEvents}</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">活跃用户（24h）</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{activeUsers}</div>
                <p className="text-xs text-muted-foreground mt-1">活跃率 {activeRate}%</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">参与用户数</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : <div className="text-2xl font-bold">{totalUsers}</div>}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              热门帖子浏览量
            </CardTitle>
            <CardDescription>统计过去事件中浏览次数最高的帖子</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {topPostsLoading ? (
              <Skeleton className="h-full w-full" />
            ) : topPostsChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">暂无数据</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topPostsChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" hide />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="views" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              热门帖子榜单
            </CardTitle>
            <CardDescription>按浏览事件统计的 Top 10 帖子</CardDescription>
          </CardHeader>
          <CardContent>
            {topPostsLoading ? (
              <div className="space-y-3">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : topPostsChart.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">暂无数据</div>
            ) : (
              <div className="space-y-3">
                {topPostsChart.map((post, index) => (
                  <div key={post.name} className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <div className="text-sm font-medium truncate max-w-[240px]">{post.name}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{post.views} 次浏览</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
