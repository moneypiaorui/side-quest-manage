"use client"

import { useState } from "react"
import useSWR from "swr"
import { getAdminPosts, auditPost, deletePost, type PostDO } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { CheckCircle, XCircle, Trash2, Eye, ChevronLeft, ChevronRight, FileText } from "lucide-react"
import { PostDetailDialog } from "@/components/post-detail-dialog"

const STATUS_MAP: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "待审核", variant: "secondary" },
  1: { label: "已通过", variant: "default" },
  2: { label: "已拒绝", variant: "destructive" },
}

export default function PostsPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>("-1")
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [selectedPost, setSelectedPost] = useState<PostDO | null>(null)

  const { data, isLoading, mutate } = useSWR(["admin-posts", page, pageSize, statusFilter], async () => {
    const result = await getAdminPosts(page, pageSize, Number.parseInt(statusFilter))
    if (result.code === 200) return result.data
    throw new Error(result.message)
  })

  const handleAudit = async (id: number, pass: boolean) => {
    try {
      const result = await auditPost(id, pass)
      if (result.code === 200) {
        toast.success(pass ? "审核通过" : "已拒绝")
        mutate()
      } else {
        toast.error(result.message || "操作失败")
      }
    } catch {
      toast.error("操作失败")
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const result = await deletePost(deleteId)
      if (result.code === 200) {
        toast.success("删除成功")
        mutate()
      } else {
        toast.error(result.message || "删除失败")
      }
    } catch {
      toast.error("删除失败")
    } finally {
      setDeleteId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">内容管理</h1>
        <p className="text-muted-foreground">管理用户发布的帖子内容，支持审核、删除等操作</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                帖子列表
              </CardTitle>
              <CardDescription>共 {data?.total || 0} 条记录</CardDescription>
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="筛选状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-1">全部状态</SelectItem>
                <SelectItem value="0">待审核</SelectItem>
                <SelectItem value="1">已通过</SelectItem>
                <SelectItem value="2">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : data?.records && data.records.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">ID</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead className="w-24">作者</TableHead>
                    <TableHead className="w-24">状态</TableHead>
                    <TableHead className="w-20 text-center">浏览</TableHead>
                    <TableHead className="w-20 text-center">点赞</TableHead>
                    <TableHead className="w-40">创建时间</TableHead>
                    <TableHead className="w-48 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.records.map((post) => (
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
                      <TableCell className="text-muted-foreground">{formatDate(post.createTime)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setSelectedPost(post)} title="查看详情">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {post.status === 0 && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAudit(post.id, true)}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                title="审核通过"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAudit(post.id, false)}
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="拒绝"
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {post.status === 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAudit(post.id, false)}
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                              title="撤销通过"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {post.status === 2 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAudit(post.id, true)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="重新通过"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(post.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  第 {page} 页，共 {data.pages} 页
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    上一页
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                    disabled={page >= data.pages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">暂无帖子数据</div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>确定要删除这篇帖子吗？此操作不可撤销。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Post Detail Dialog */}
      <PostDetailDialog post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  )
}
