import appsAndPages from './apps-and-pages'
import charts from './charts'
import dashboard from './dashboard'
import forms from './forms'
import others from './others'
import uiElements from './ui-elements'
import usuarios from './usuarios'
import contabilidad from './contabilidad'
import direccion from './direccion'
import inicio from './inicio'

// //  export default [...dashboard, ...appsAndPages, ...uiElements, ...forms, ...charts, ...others]
// // export default [...usuarios, ...dashboard, ...appsAndPages, ...uiElements, ...forms, ...charts, ...others]
// export default [...usuarios, ...contabilidad, ...dashboard]

// const navItemsRaw = [...inicio, ...contabilidad, ...direccion, ...dashboard, ...appsAndPages, ...uiElements, ...forms, ...charts, ...others]
const navItemsRaw = [...inicio, ...direccion, ...contabilidad,]
const userPermissions = JSON.parse(localStorage.getItem('userPermissions') || '[]')

// console.log('Permisos del usuario:', userPermissions)


// Si el item no tiene permisoId, siempre aparece.
// Si tiene permisoId, solo aparece si coincide con userPermissions.
// Los hijos se filtran recursivamente de la misma manera.


function filterNavItemsStrict(items, userPermissions) {
  if (!Array.isArray(items)) return []

  return items
    .filter(item => !item.permisoId || userPermissions.includes(item.permisoId)) // si no tiene permisoId, siempre aparece
    .map(item => {
      if (Array.isArray(item.children)) {
        return {
          ...item,
          children: filterNavItemsStrict(item.children, userPermissions) // filtrar hijos recursivamente
        }
      }
      return item
    })
}

const navItems = filterNavItemsStrict(navItemsRaw, userPermissions)

export default navItems