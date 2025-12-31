"use client"

import { useState } from "react"
import useSWR from "swr"
import { getAdminUsers, banUser, type UserVO } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Ban, ChevronLeft, ChevronRight, Users, FileText, Heart, UserCheck } from "lucide-react"

const USER_STATUS_MAP: Record<number, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  0: { label: "正常", variant: "default" },
  1: { label: "已封禁", variant: "destructive" },
}

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<string>("-1")
  const [banId, setBanId] = useState<number | null>(null)
  const [banUserInfo, setBanUserInfo] = useState<UserVO | null>(null)

  const { data, isLoading, mutate } = useSWR(["admin-users", page, pageSize, statusFilter], async () => {
    const result = await getAdminUsers(page, pageSize, Number.parseInt(statusFilter))
    if (result.code === 200) return result.data
    throw new Error(result.message)
  })

  const handleBan = async () => {
    if (!banId) return
    try {
      const result = await banUser(banId)
      if (result.code === 200) {
        toast.success("操作成功")
        mutate()
      } else {
        toast.error(result.message || "操作失败")
      }
    } catch {
      toast.error("操作失败")
    } finally {
      setBanId(null)
      setBanUserInfo(null)
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
        <h1 className="text-2xl font-bold tracking-tight">用户管理</h1>
        <p className="text-muted-foreground">管理系统用户，支持查看信息和封禁操作</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                用户列表
              </CardTitle>
              <CardDescription>共{data?.total || 0} 条记录</CardDescription>
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
                <SelectItem value="0">正常</SelectItem>
                <SelectItem value="1">已封禁</SelectItem>
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
                    <TableHead>用户信息</TableHead>
                    <TableHead className="w-20">角色</TableHead>
                    <TableHead className="w-20">状态</TableHead>
                    <TableHead className="w-20 text-center">
                      <FileText className="h-4 w-4 mx-auto" />
                    </TableHead>
                    <TableHead className="w-20 text-center">
                      <UserCheck className="h-4 w-4 mx-auto" />
                    </TableHead>
                    <TableHead className="w-20 text-center">
                      <Heart className="h-4 w-4 mx-auto" />
                    </TableHead>
                    <TableHead className="w-40">注册时间</TableHead>
                    <TableHead className="w-24 text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.records.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">{user.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.nickname} />
                            <AvatarFallback>{user.nickname?.[0] || "U"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.nickname}</p>
                            <p className="text-sm text-muted-foreground">@{user.username}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === "admin" || user.role === "ADMIN" ? "default" : "secondary"}>
                          {user.role === "admin" || user.role === "ADMIN" ? "管理员" : "用户"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={USER_STATUS_MAP[user.status]?.variant || "secondary"}>
                          {USER_STATUS_MAP[user.status]?.label || "未知"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{user.postCount}</TableCell>
                      <TableCell className="text-center">{user.followerCount}</TableCell>
                      <TableCell className="text-center">{user.totalLikedCount}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.createTime)}</TableCell>
                      <TableCell className="text-right">
                        {user.status === 0 && user.role !== "admin" && user.role !== "ADMIN" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setBanId(user.id)
                              setBanUserInfo(user)
                            }}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            title="封禁用户"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  第{page}页，共{data.pages}页
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
            <div className="text-center py-12 text-muted-foreground">暂无用户数据</div>
          )}
        </CardContent>
      </Card>

      {/* Ban Confirmation Dialog */}
      <AlertDialog
        open={!!banId}
        onOpenChange={() => {
          setBanId(null)
          setBanUserInfo(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认封禁</AlertDialogTitle>
            <AlertDialogDescription>
              确定要封禁用户 <strong>{banUserInfo?.nickname}</strong> (@{banUserInfo?.username}) 吗？封禁后该用户将无法登录和使用系统功能。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              封禁
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
