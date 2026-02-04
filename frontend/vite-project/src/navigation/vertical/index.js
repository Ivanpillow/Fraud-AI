import inicio from './inicio'
import direccion from './direccion'
import contabilidad from './contabilidad'

import appsAndPages from './apps-and-pages'
import charts from './charts'
import dashboard from './dashboard'
import forms from './forms'
import others from './others'
import uiElements from './ui-elements'

export default [...dashboard, ...appsAndPages, ...uiElements, ...forms, ...charts, ...others]


// const { permissions } = useUiPermissions()

// const navItemsRaw = [
//   ...inicio,
//   ...direccion,
//   ...contabilidad,
//   // ...forms,
// ]

// function filterNavItemsStrict(items, userPermissions) {
//   if (!Array.isArray(items)) return []

//   return items
//     .filter(item => {
//       // si no tiene permisoId, siempre aparece
//       if (!item.permisoId) return true

//       // si tiene permisoId, validar contra permisos del backend
//       return userPermissions.includes(item.permisoId)
//     })
//     .map(item => {
//       if (Array.isArray(item.children)) {
//         return {
//           ...item,
//           children: filterNavItemsStrict(item.children, userPermissions),
//         }
//       }
//       return item
//     })
// }

// const navItems = filterNavItemsStrict(navItemsRaw, permissions.value)

// export default navItems
