/**
 * Façade d'accès à la configuration.
 *
 * Le corps de la classe a été réparti dans `./config/` : valeurs par défaut et
 * normalisation, lecture des cellules, fichiers et requêtes, fusion, paramètres
 * d'URL, Gist, export. Chaque méthode statique délègue à la fonction du module
 * correspondant, ce qui laisse intacts les appels `ConfigManager.x(...)`.
 */
import {getDefaultConfig, loadDefaultConfigOrEncrypted, normalizeOrder, normalizeCell, normalizeGroup} from './config/defaults'
import {getCellQuery, getCellQueryShowQueryEditor, getCellQueryShowResult, getQueryByName, getQueryIndexByName, getQueryNameForIndex, getQuery2Name, getDefaultEngineForType, getCellEditableContent, setCellEditableContent, getCellContentDisplay, getMarkdownDisplayContent, getMarkdownContent, setMarkdownContent, getCellReferenceName, isCellNameValid, cellBlocksAutoFlow, cellRequiresFileBeforeRun, cellSkippedWhenButtonLabel, cellShowOnlyWhenButtonLabel, cellHideInViewMode, cellShowInViewWhenResultOrRunning, cellTableSearchable, cellExportRuntimeBlob, cellExportTemplateBase64, hasCellsWithExportSlot} from './config/cell-accessors'
import {getCellFileSlot, getCellFileData, setCellFileData, ensureCellFiles, getCellEngine, ensureCellQueries, ensureGroupQueries, getGroupIfQuery, setCellQuery, encodeUTF8ToBase64, compressToGzipBase64, decompressFromGzipBase64, generateGroupId, generatePageId} from './config/cell-files'
import {deepMerge} from './config/merging'
import {getUIParamsFromURL, applyURLParamsToConfig} from './config/url'
import {prepareConfigForLoad, loadConfigFromGist} from './config/gist'
import {cleanCell, cleanGroup, buildConfigFromState} from './config/export'
import {SQLJOB_VERSION} from './config/defaults'
export {exportConfigToJson} from './config/export'

export class ConfigManager {
    static getDefaultConfig = getDefaultConfig;
    static loadDefaultConfigOrEncrypted = loadDefaultConfigOrEncrypted;
    static normalizeOrder = normalizeOrder;
    static normalizeCell = normalizeCell;
    static normalizeGroup = normalizeGroup;
    static getCellQuery = getCellQuery;
    static getCellQueryShowQueryEditor = getCellQueryShowQueryEditor;
    static getCellQueryShowResult = getCellQueryShowResult;
    static getQueryByName = getQueryByName;
    static getQueryIndexByName = getQueryIndexByName;
    static getQueryNameForIndex = getQueryNameForIndex;
    static getQuery2Name = getQuery2Name;
    static getDefaultEngineForType = getDefaultEngineForType;
    static getCellEditableContent = getCellEditableContent;
    static setCellEditableContent = setCellEditableContent;
    static getCellContentDisplay = getCellContentDisplay;
    static getMarkdownDisplayContent = getMarkdownDisplayContent;
    static getMarkdownContent = getMarkdownContent;
    static setMarkdownContent = setMarkdownContent;
    static getCellReferenceName = getCellReferenceName;
    static isCellNameValid = isCellNameValid;
    static cellBlocksAutoFlow = cellBlocksAutoFlow;
    static cellRequiresFileBeforeRun = cellRequiresFileBeforeRun;
    static cellSkippedWhenButtonLabel = cellSkippedWhenButtonLabel;
    static cellShowOnlyWhenButtonLabel = cellShowOnlyWhenButtonLabel;
    static cellHideInViewMode = cellHideInViewMode;
    static cellShowInViewWhenResultOrRunning = cellShowInViewWhenResultOrRunning;
    static cellTableSearchable = cellTableSearchable;
    static cellExportRuntimeBlob = cellExportRuntimeBlob;
    static cellExportTemplateBase64 = cellExportTemplateBase64;
    static hasCellsWithExportSlot = hasCellsWithExportSlot;
    static getCellFileSlot = getCellFileSlot;
    static getCellFileData = getCellFileData;
    static setCellFileData = setCellFileData;
    static ensureCellFiles = ensureCellFiles;
    static getCellEngine = getCellEngine;
    static ensureCellQueries = ensureCellQueries;
    static ensureGroupQueries = ensureGroupQueries;
    static getGroupIfQuery = getGroupIfQuery;
    static setCellQuery = setCellQuery;
    static encodeUTF8ToBase64 = encodeUTF8ToBase64;
    static compressToGzipBase64 = compressToGzipBase64;
    static decompressFromGzipBase64 = decompressFromGzipBase64;
    static generateGroupId = generateGroupId;
    static generatePageId = generatePageId;
    static deepMerge = deepMerge;
    static getUIParamsFromURL = getUIParamsFromURL;
    static applyURLParamsToConfig = applyURLParamsToConfig;
    static prepareConfigForLoad = prepareConfigForLoad;
    static loadConfigFromGist = loadConfigFromGist;
    static cleanCell = cleanCell;
    static cleanGroup = cleanGroup;
    static buildConfigFromState = buildConfigFromState;
    static SQLJOB_VERSION = SQLJOB_VERSION;
}
