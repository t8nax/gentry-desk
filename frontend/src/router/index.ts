import { createRouter, createWebHistory } from 'vue-router'
import { worktreesRoutes } from '@/views/worktrees/worktreesRoutes'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: { name: 'worktrees' } },
    ...worktreesRoutes,
    { path: '/:pathMatch(.*)*', redirect: { name: 'worktrees' } },
  ],
})
