import { getCookie, getQuery, createError, type H3Event } from "h3"

type Category = {
  id: number
  name: string
}

type Product = {
  id: number
  name: string
  category?: Category
}

type PaginatedProducts = {
  current_page: number
  data: Product[]
  per_page: number
  total: number
  last_page: number
  [key: string]: any // for extra fields like links, from, to, etc.
}

export default defineEventHandler(async (event: H3Event): Promise<PaginatedProducts> => {
  const { apiBaseUrl } = useRuntimeConfig(event)

  const token = getCookie(event, "token")
  if (!token) {
    throw createError({
      statusCode: 401,
      statusMessage: "Unauthorized",
    })
  }

  const query = getQuery(event)

  try {

    const res = await $fetch<PaginatedProducts>(`${apiBaseUrl}/api/products`, {
      method: "GET",
      query,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    })

    return res
  } catch (err: any) {
    const message = err?.data?.message || err?.message || "Failed to fetch products"
    throw createError({
      statusCode: err?.status || 500,
      statusMessage: message,
      data: err?.data,
    })
  }
})