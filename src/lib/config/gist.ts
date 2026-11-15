// Module extrait de ConfigManager.ts — chargement depuis un Gist.

import {GistEncrypt} from '../GistEncrypt'
import {FileHandler} from '../FileHandler'
import {getDefaultConfig, loadDefaultConfigOrEncrypted} from './defaults'
import {deepMerge} from './merging'
import {applyURLParamsToConfig} from './url'

    export async function prepareConfigForLoad(config) {
        if (!config?.job?.pages) return config;
        const decompressInGroup = async (group) => {
            if (group.children?.length) {
                for (const child of group.children) await decompressInGroup(child);
            }
            for (const cell of group.cells || []) {
                if (!Array.isArray(cell.files)) continue;
                for (const f of cell.files) {
                    if (f.compressed && f.base64 && f.fileName) {
                        try {
                            const bytes = FileHandler.base64ToUint8Array(f.base64);
                            const decompressed = await FileHandler.decompressGzip(bytes);
                            f.base64 = FileHandler.arrayBufferToBase64(decompressed);
                            delete f.compressed;
                        } catch (e) {
                            console.warn('Décompression fichier échouée:', f.fileName, e);
                        }
                    }
                }
                if (cell.fileBase64 && cell.files?.[0]?.compressed) {
                    try {
                        const bytes = FileHandler.base64ToUint8Array(cell.fileBase64);
                        const decompressed = await FileHandler.decompressGzip(bytes);
                        cell.fileBase64 = FileHandler.arrayBufferToBase64(decompressed);
                        if (cell.files[0]) delete cell.files[0].compressed;
                    } catch (e) {
                        console.warn('Décompression fileBase64 échouée:', e);
                    }
                }
            }
        };
        for (const page of config.job.pages) {
            for (const group of page.groups || []) await decompressInGroup(group);
        }
        return config;
    }

    export async function loadConfigFromGist() {
        const gistId = (() => {
            const urlParams = new URLSearchParams(window.location.search);
            const gistParam = urlParams.get('gist');
            if (gistParam && /^[a-f0-9]{32}$/i.test(gistParam)) return gistParam;
            if (gistParam) {
                const match = gistParam.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]{32})/i);
                if (match) return match[1];
            }
            const configParam = urlParams.get('config');
            if (configParam) {
                const match = configParam.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]{32})/i);
                if (match) return match[1];
            }
            const fullUrlMatch = window.location.href.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]{32})/i);
            if (fullUrlMatch) return fullUrlMatch[1];
            return null;
        })();

        let baseConfig = null;

        if (gistId) {
            try {
                const apiUrl = `https://api.github.com/gists/${gistId}`;
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const gistData = await response.json();
                    const files = Object.values(gistData.files || {}) as any[];
                    const jsonFile = files.find(file =>
                        file.filename.toLowerCase().endsWith('.json') ||
                        file.type === 'application/json'
                    );
                    if (jsonFile) {
                        try {
                            const parsed = JSON.parse(jsonFile.content);
                            let config;
                            if (GistEncrypt.isEncrypted(parsed)) {
                                return { needsPassphrase: true, encryptedContent: parsed };
                            } else {
                                config = parsed;
                                baseConfig = deepMerge(getDefaultConfig(), config);
                                await prepareConfigForLoad(baseConfig);
                            }
                        } catch (err) {
                            console.error('❌ Erreur Gist (parsing ou déchiffrement):', err);
                            throw new Error(err.message || `Erreur: ${String(err)}`);
                        }
                    } else {
                        console.warn('⚠️ Aucun fichier JSON trouvé dans le Gist');
                    }
                } else {
                    console.error('❌ Erreur HTTP lors du chargement du Gist:', response.status, response.statusText);
                }
            } catch (error) {
                console.error('❌ Erreur lors du chargement du Gist:', error);
            }
        }

        // Si pas de config depuis le gist, utiliser la config par défaut (base64 ou HTML embarqué)
        if (!baseConfig) {
            const defaultResult = loadDefaultConfigOrEncrypted();
            if (defaultResult.needsPassphrase && defaultResult.encryptedContent) {
                return { needsPassphrase: true, encryptedContent: defaultResult.encryptedContent, source: defaultResult.source || 'html' };
            }
            baseConfig = defaultResult.config;
            await prepareConfigForLoad(baseConfig);
        }

        // Appliquer les paramètres URL en priorité (URL > gist > base64 > default)
        return applyURLParamsToConfig(baseConfig);
    }
