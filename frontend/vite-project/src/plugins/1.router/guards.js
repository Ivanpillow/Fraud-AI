// import { canNavigate } from '@layouts/plugins/casl'
import { useAuth } from '@/composables/useAuth'

export const setupGuards = router => {
  router.beforeEach(async to => {

    // 1️⃣ Rutas públicas pasan directo
    if (to.meta.public) return true

    const { user, loading, fetchSession } = useAuth()

    // 2️⃣ Resolver sesión si aún no está cargada
    if (!user.value && !loading.value) {
      await fetchSession()
    }

    const isLoggedIn = !!user.value

    // 3️⃣ Si no está logueado → login (pero NO si ya está ahí)
    if (!isLoggedIn) {
      if (to.name === 'login') return true

      return {
        name: 'login',
        query: {
          to: to.fullPath !== '/' ? to.path : undefined,
        },
      }
    }

    // 4️⃣ Si está logueado y quiere ir a login → inicio
    if (to.meta.unauthenticatedOnly && isLoggedIn) {
      return '/inicio'
    }

    // 5️⃣ ACL
    // if (!canNavigate(to) && to.matched.length) {
    //   return { name: 'not-authorized' }
    // }

    return true
  })
}