const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ""

export interface ApiResult<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export interface SearchPageResult<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export interface UserVO {
  id: number
  username: string
  nickname: string
  avatar: string
  signature: string
  role: string
  status: number
  followerCount: number
  followingCount: number
  totalLikedCount: number
  postCount: number
  createTime: string
}

export interface PostDO {
  id: number
  authorId: number
  authorName: string
  title: string
  content: string
  sectionId: number
  status: number
  likeCount: number
  commentCount: number
  favoriteCount: number
  viewCount: number
  createTime: string
  updateTime: string
  imageUrls: string
  videoUrl: string | null
  videoCoverUrl: string | null
  videoDuration: number | null
  tags: string
}

export interface PostDoc {
  id: string
  title: string
  content: string
  authorName: string
  authorId: number
  imageUrls: string
  sectionId: number
  status: number
  likeCount: number
  commentCount: number
  favoriteCount: number
  viewCount: number
  createTime: number
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  totalPosts: number
  pendingPosts: number
  approvedPosts: number
  rejectedPosts: number
  totalComments?: number
  totalLikes?: number
  [key: string]: unknown
}

export interface TopPost {
  id?: number
  title?: string
  viewCount?: number
  likeCount?: number
  [key: string]: unknown
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResult<T>> {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  if (token) {
    ;(headers as Record<string, string>)["Authorization"] = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// Auth APIs
export async function login(username: string, password: string) {
  return request<{ token: string; userId: number; nickname: string }>("/api/identity/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  })
}

export async function getCurrentUser() {
  return request<UserVO>("/api/identity/me")
}

// Admin Posts APIs
export async function getAdminPosts(current = 1, size = 10, status?: number) {
  const params = new URLSearchParams({ current: String(current), size: String(size) })
  if (status !== undefined && status !== -1) params.append("status", String(status))
  return request<PageResult<PostDO>>(`/api/core/admin/posts?${params}`)
}

export async function getPostDetail(id: number) {
  return request<PostDO>(`/api/core/posts/${id}`)
}

export async function auditPost(id: number, pass: boolean) {
  return request<string>(`/api/core/admin/posts/${id}/audit?pass=${pass}`, {
    method: "POST",
  })
}

export async function deletePost(id: number) {
  return request<string>(`/api/core/admin/posts/${id}`, {
    method: "DELETE",
  })
}

// Admin Users APIs
export async function getAdminUsers(current = 1, size = 10, status?: number) {
  const params = new URLSearchParams({ current: String(current), size: String(size) })
  if (status !== undefined && status !== -1) params.append("status", String(status))
  return request<PageResult<UserVO>>(`/api/identity/admin/users?${params}`)
}

export async function banUser(id: number) {
  return request<string>(`/api/identity/admin/users/${id}/ban`, {
    method: "POST",
  })
}

// Search APIs
export async function searchPosts(keyword: string, page = 0, size = 10) {
  const params = new URLSearchParams({ keyword, page: String(page), size: String(size) })
  return request<SearchPageResult<PostDoc>>(`/api/search/posts?${params}`)
}

export async function searchUserPosts(userId: number, page = 0, size = 10) {
  const params = new URLSearchParams({ userId: String(userId), page: String(page), size: String(size) })
  return request<SearchPageResult<PostDoc>>(`/api/search/user/posts?${params}`)
}

// Analytics APIs
export async function getDashboardStats() {
  return request<DashboardStats>("/api/analytics/dashboard/stats")
}

export async function getTopPosts() {
  return request<TopPost[]>("/api/analytics/dashboard/top-posts")
}

export async function getUserStats(userId: number) {
  return request<Record<string, unknown>>(`/api/analytics/users/${userId}/stats`)
}
