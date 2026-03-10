export default defineEventHandler(async (event) => {
    const { apiBaseUrl } = useRuntimeConfig(event)
    const token = getCookie(event, "token")
    if (!token) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" })
    }
  
    const query = getQuery(event)
  
    type Category = {
      id: number
      name: string
    }
  
    try {
      const res = await $fetch<Category[]>(`${apiBaseUrl}/api/categories`, {
        method: "GET",
        query,
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      })
      return res
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "Failed to fetch categories"
      throw createError({
        statusCode: err?.status || 500,
        statusMessage: message,
        data: err?.data
      })
    }
  })