"use client"

import type React from "react"
import { Suspense, useState } from "react"
import useSWR from "swr"
import { searchPosts, searchUserPosts, type PostDoc } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, ChevronLeft, ChevronRight, Eye, Heart, MessageSquare } from "lucide-react"

const STATUS_MAP: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "待审核", variant: "secondary" },
  1: { label: "已通过", variant: "default" },
  2: { label: "已拒绝", variant: "destructive" },
}

function SearchPageContent() {
  const [activeTab, setActiveTab] = useState("keyword")
  const [keyword, setKeyword] = useState("")
  const [userId, setUserId] = useState("")
  const [searchTrigger, setSearchTrigger] = useState<{ type: string; value: string; page: number } | null>(null)

  const { data, isLoading } = useSWR(searchTrigger ? ["search", searchTrigger] : null, async () => {
    if (!searchTrigger) return null
    if (searchTrigger.type === "keyword") {
      const result = await searchPosts(searchTrigger.value, searchTrigger.page, 10)
      if (result.code === 200) return result.data
      throw new Error(result.message)
    } else {
      const result = await searchUserPosts(Number.parseInt(searchTrigger.value), searchTrigger.page, 10)
      if (result.code === 200) return result.data
      throw new Error(result.message)
    }
  })

  const handleKeywordSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return
    setSearchTrigger({ type: "keyword", value: keyword.trim(), page: 0 })
  }

  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId.trim()) return
    setSearchTrigger({ type: "user", value: userId.trim(), page: 0 })
  }

  const handlePageChange = (newPage: number) => {
    if (!searchTrigger) return
    setSearchTrigger({ ...searchTrigger, page: newPage })
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const renderResults = (posts: PostDoc[] | undefined) => {
    if (!posts || posts.length === 0) {
      return <div className="text-center py-12 text-muted-foreground">暂无搜索结果</div>
    }

    return (
      <>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">ID</TableHead>
              <TableHead>标题</TableHead>
              <TableHead className="w-24">作者</TableHead>
              <TableHead className="w-24">状态</TableHead>
              <TableHead className="w-20 text-center">
                <Eye className="h-4 w-4 mx-auto" />
              </TableHead>
              <TableHead className="w-20 text-center">
                <Heart className="h-4 w-4 mx-auto" />
              </TableHead>
              <TableHead className="w-20 text-center">
                <MessageSquare className="h-4 w-4 mx-auto" />
              </TableHead>
              <TableHead className="w-40">创建时间</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id}>
                <TableCell className="font-mono text-sm">{post.id}</TableCell>
                <TableCell className="max-w-xs truncate font-medium">{post.title}</TableCell>
                <TableCell className="text-muted-foreground">{post.authorName}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_MAP[post.status]?.variant || "outline"}>
                    {STATUS_MAP[post.status]?.label || "未知"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">{post.viewCount}</TableCell>
                <TableCell className="text-center">{post.likeCount}</TableCell>
                <TableCell className="text-center">{post.commentCount}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(post.createTime)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              第{(data.number || 0) + 1}页，共{data.totalPages}页（{data.totalElements}条结果）
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(Math.max(0, (searchTrigger?.page || 0) - 1))}
                disabled={!searchTrigger || searchTrigger.page <= 0}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange((searchTrigger?.page || 0) + 1)}
                disabled={!data || (data.number || 0) + 1 >= data.totalPages}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">搜索查询</h1>
        <p className="text-muted-foreground">通过关键词或用户ID搜索帖子内容</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            搜索帖子
          </CardTitle>
          <CardDescription>输入关键词或用户ID进行搜索</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="keyword">关键词搜索</TabsTrigger>
              <TabsTrigger value="user">按用户搜索</TabsTrigger>
            </TabsList>

            <TabsContent value="keyword" className="mt-4">
              <form onSubmit={handleKeywordSearch} className="flex gap-2 max-w-md">
                <Input
                  placeholder="输入关键词搜索帖子..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
                <Button type="submit" disabled={!keyword.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  搜索
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="user" className="mt-4">
              <form onSubmit={handleUserSearch} className="flex gap-2 max-w-md">
                <Input
                  placeholder="输入用户ID搜索帖子..."
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  type="number"
                />
                <Button type="submit" disabled={!userId.trim()}>
                  <Search className="h-4 w-4 mr-2" />
                  搜索
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Search Results */}
          <div className="mt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : searchTrigger ? (
              renderResults(data?.content)
            ) : (
              <div className="text-center py-12 text-muted-foreground">请输入搜索条件</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageContent />
    </Suspense>
  )
}
