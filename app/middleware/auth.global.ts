export default defineNuxtRouteMiddleware((to) => {
    const { isAuthenticated } = useAuth()
  
    const requiresAuth = to.meta.requiresAuth || false
    const guestOnly = to.meta.guestOnly || false
  
    // Redirect to login if auth is required and user is not authenticated
    if (requiresAuth && !isAuthenticated.value && to.path !== "/login") {
      return navigateTo(`/login?redirectTo=${encodeURIComponent(to.fullPath)}`, { replace: true })
    }
  
    // Redirect to dashboard if guest-only page and user is authenticated
    if (guestOnly && isAuthenticated.value && to.path !== "/dashboard") {
      return navigateTo("/dashboard", { replace: true })
    }
  })