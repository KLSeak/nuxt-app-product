const useUser = () => useState<any | null>("user", () => null);

export const useAuth = () => {
  type LoginREQ = { email: string; password: string }
  const token = useCookie<string | null>("token")
  const user = useUser()

  const loading = ref(false)
  const isAuthenticated = computed(() => !!user.value);

  const login = async (credentials: LoginREQ) => {
    try {
      loading.value = true
      const res = await $fetch("/api/auth/login", {
        method: "POST",
        body: credentials,
      })

      token.value = res.token
      user.value = res.user

      await navigateTo("/dashboard", { replace: true })
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  const logout = async () => {
    try {
      const token = useCookie<string | null>('token');
      await $fetch("/api/auth/logout", { 
        method: "POST",   headers: {
          Authorization: `Bearer ${token.value}`
        }})
      token.value = null;
      user.value = null;
    } catch (err) {
      console.warn("Logout API failed, clearing local state anyway", err)
    }

    token.value = null 
    user.value = null

    await navigateTo("/login", { replace: true })
  }


  return {
    loading,
    login,
    logout,
    token,
    user,
    isAuthenticated,
  }

}