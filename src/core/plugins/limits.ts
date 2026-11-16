/**
 * Bornes de taille des plugins.
 *
 * - `MAX_PLUGIN_BYTES` : refus à l'installation, avant toute vérification
 *   d'empreinte (un fichier de 500 Mo ne doit pas être téléchargé pour rien).
 * - `MAX_EMBEDDED_SOURCE_BYTES` : au-delà, un export HTML ne transporte pas la
 *   source du module et se contente de son URL d'origine.
 */
export const MAX_PLUGIN_BYTES = 8 * 1024 * 1024
export const MAX_EMBEDDED_SOURCE_BYTES = 4 * 1024 * 1024
