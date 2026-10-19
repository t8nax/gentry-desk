import type { RouteRecordRaw } from 'vue-router'

export const worktreesRoutes: RouteRecordRaw[] = [
  {
    path: '/worktrees',
    name: 'worktrees',
    component: () => import('@/views/worktrees/WorktreesPage.vue'),
  },
]
