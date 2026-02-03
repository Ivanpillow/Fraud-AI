import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'


export const ability = createMongoAbility([])

export default function (app) {
  // const userAbilityRules = useCookie('userAbilityRules')
  // const initialAbility = createMongoAbility(userAbilityRules.value ?? [])

  app.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  })
}
