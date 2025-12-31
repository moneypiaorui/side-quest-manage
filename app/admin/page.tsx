"use client"
import useSWR from "swr"
import { getAdminPosts, getDashboardStats, getTopPosts, type PostDO, type DashboardStats, type TopPost } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3,
  Activity,
  MessageSquare,
  Heart,
  Eye,
} from "lucide-react"
import Link from "next/link"

const statsFetcher = async (): Promise<DashboardStats> => {
  try {
    const result = await getDashboardStats()
    if (result.code === 200 && result.data) {
      return result.data
    }
  } catch (e) {
    console.log("[v0] Stats API failed, falling back to pagination:", e)
  }

  // 降级方案：通过分页接口获取统计
  const [pendingResult, approvedResult, rejectedResult] = await Promise.all([
    getAdminPosts(1, 1, 0),
    getAdminPosts(1, 1, 1),
    getAdminPosts(1, 1, 2),
  ])

  const pending = pendingResult.code === 200 ? pendingResult.data.total : 0
  const approved = approvedResult.code === 200 ? approvedResult.data.total : 0
  const rejected = rejectedResult.code === 200 ? rejectedResult.data.total : 0

  return {
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalPosts: pending + approved + rejected,
    pendingPosts: pending,
    approvedPosts: approved,
    rejectedPosts: rejected,
  }
}

const recentPostsFetcher = async () => {
  const result = await getAdminPosts(1, 5, 0)
  if (result.code === 200) return result.data.records
  return []
}

const topPostsFetcher = async (): Promise<TopPost[]> => {
  const result = await getTopPosts()
  if (result.code === 200) return result.data || []
  return []
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useSWR("dashboard-stats", statsFetcher)
  const { data: recentPosts, isLoading: recentLoading } = useSWR<PostDO[]>("recent-posts", recentPostsFetcher)
  const { data: topPosts, isLoading: topPostsLoading } = useSWR<TopPost[]>("dashboard-top-posts", topPostsFetcher)

  const totalUsers = stats?.totalUsers ?? 0
  const activeUsers = stats?.activeUsers24h ?? stats?.activeUsers ?? 0
  const totalEvents = stats?.totalEvents ?? 0
  const activeRate = totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0:
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            待审核
          </Badge>
        )
      case 1:
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            已通过
          </Badge>
        )
      case 2:
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            已拒绝
          </Badge>
        )
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">仪表盘</h1>
        <p className="text-muted-foreground">查看系统整体运行状态和数据概览</p>
      </div>

      {/* 核心统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 总用户数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalUsers?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">{stats?.activeUsers || 0} 正常</span>
                  {" / "}
                  <span className="text-red-600">{stats?.bannedUsers || 0} 封禁</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 总帖子数 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总帖子数</CardTitle>
            <FileText className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.totalPosts?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-green-600">{stats?.approvedPosts || 0} 已通过</span>
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* 待审核帖子 */}
        <Card className="border-yellow-200 bg-yellow-50/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">待审核帖子</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-700">{stats?.pendingPosts?.toLocaleString() || 0}</div>
                <Link href="/admin/posts?status=0">
                  <Button variant="link" className="p-0 h-auto text-xs text-yellow-600 hover:text-yellow-800">
                    立即审核 <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* 已拒绝帖子 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">已拒绝帖子</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-bold">{stats?.rejectedPosts?.toLocaleString() || 0}</div>
                <Link href="/admin/posts?status=2">
                  <Button variant="link" className="p-0 h-auto text-xs text-muted-foreground hover:text-foreground">
                    查看详情 <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {(stats?.totalComments !== undefined || stats?.totalLikes !== undefined) && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总评论数</CardTitle>
              <MessageSquare className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalComments?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总点赞数</CardTitle>
              <Heart className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalLikes?.toLocaleString() || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总浏览量</CardTitle>
              <Eye className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats as Record<string, unknown>)?.totalViews?.toLocaleString?.() || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {(stats?.totalEvents !== undefined || stats?.activeUsers24h !== undefined) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                数据概览
              </CardTitle>
              <CardDescription>行为事件与活跃用户统计</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">事件总量</div>
                    <div className="text-2xl font-bold">{totalEvents.toLocaleString()}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>活跃用户（24h）</span>
                      <span className="font-medium">
                        {activeUsers.toLocaleString()} / {totalUsers.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-500"
                        style={{ width: `${activeRate}%` }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">活跃率 {activeRate}%</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                热门帖子
              </CardTitle>
              <CardDescription>按浏览事件统计的最热内容</CardDescription>
            </CardHeader>
            <CardContent>
              {topPostsLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full" />
                  ))}
                </div>
              ) : topPosts && topPosts.length > 0 ? (
                <div className="space-y-3">
                  {topPosts.slice(0, 5).map((post, index) => (
                    <div key={post.postId ?? post.id ?? index} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="text-sm font-medium">#{post.postId ?? post.id}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">{(post.viewCount || 0).toLocaleString()} 次浏览</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">暂无热门数据</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* 帖子状态概览 & 最近待审核 */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* 帖子状态分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              帖子状态分布
            </CardTitle>
            <CardDescription>各状态帖子数量统计</CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* 待审核 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-24">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">待审核</span>
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{
                        width: stats?.totalPosts ? `${((stats.pendingPosts || 0) / stats.totalPosts) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{stats?.pendingPosts || 0}</span>
                </div>
                {/* 已通过 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-24">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">已通过</span>
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all duration-500"
                      style={{
                        width: stats?.totalPosts ? `${((stats.approvedPosts || 0) / stats.totalPosts) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{stats?.approvedPosts || 0}</span>
                </div>
                {/* 已拒绝 */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 w-24">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">已拒绝</span>
                  </div>
                  <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{
                        width: stats?.totalPosts ? `${((stats.rejectedPosts || 0) / stats.totalPosts) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">{stats?.rejectedPosts || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 最近待审核帖子 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  最近待审核
                </CardTitle>
                <CardDescription>需要处理的最新帖子</CardDescription>
              </div>
              <Link href="/admin/posts?status=0">
                <Button variant="outline" size="sm">
                  查看全部
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : recentPosts && recentPosts.length > 0 ? (
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <div
                    key={post.id}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{post.title || "无标题"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>@{post.authorName}</span>
                        <span>·</span>
                        <span>{new Date(post.createTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {getStatusBadge(post.status)}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-2" />
                <p className="text-muted-foreground">暂无待审核帖子</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 快捷操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
          <CardDescription>常用管理功能入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/admin/posts">
              <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">内容管理</p>
                  <p className="text-sm text-muted-foreground">审核和管理帖子</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/users">
              <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">用户管理</p>
                  <p className="text-sm text-muted-foreground">管理用户账户</p>
                </div>
              </div>
            </Link>
            <Link href="/admin/search">
              <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">搜索查询</p>
                  <p className="text-sm text-muted-foreground">搜索帖子内容</p>
                </div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
