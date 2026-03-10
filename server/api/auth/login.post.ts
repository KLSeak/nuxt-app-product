import { z } from "zod"
import { readBody, setCookie, createError } from "h3"

const schema = z.object({
  email: z.string().nonempty("Please enter email").email("Please enter a valid email"),
  password: z.string().nonempty("Please enter password"),
})

type LoginREQ = z.infer<typeof schema>

type User = {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  active: number
  status: string
  created_at: string
  updated_at: string
}

type LoginRES = {
  user: User
  token: string
  message: string
  code: number
}

export default defineEventHandler(async (event) => {
  const { apiBaseUrl } = useRuntimeConfig(event)

  const body = await readBody<LoginREQ>(event)

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    throw createError({
      statusCode: 422,
      statusMessage: "Validation error",
      data: parsed.error.flatten().fieldErrors,
    })
  }

  try {
    const res = await $fetch<LoginRES>(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: parsed.data,
    })

    setCookie(event, "token", res.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    })

    return { user: res.user, token: res.token }
  } catch (err: any) {
    throw createError({
      statusCode: 401,
      statusMessage: err?.data?.message || err?.message || "Login failed",
    })
  }
})