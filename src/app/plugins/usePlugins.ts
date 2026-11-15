import {useSyncExternalStore} from 'react'
import {subscribePlugins, getPluginsState} from './pluginRuntime'

/** État des plugins, re-rendu à chaque installation, activation ou erreur. */
export function usePlugins() {
    return useSyncExternalStore(subscribePlugins, getPluginsState, getPluginsState)
}
