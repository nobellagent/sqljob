/**
 * Version de l'application, pour les manifestes de plugins (`sqljobMinVersion`).
 *
 * Volontairement en dur : importer `package.json` demanderait `resolveJsonModule`
 * et ferait entrer le manifeste npm dans le bundle. Un test vérifie que cette
 * constante et `package.json` ne divergent pas.
 */
export const APP_VERSION = '0.5.1'
