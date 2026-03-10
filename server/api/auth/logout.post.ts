export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
  
    try {
      await $fetch(config.apiBaseUrl + "/api/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: {
        },
      })
    } catch (e) {
      console.warn("logout failed, clearing cookie anyway")
    }
  
    deleteCookie(event, "token", { path: "/" })
  
    return { success: true }
  
  })