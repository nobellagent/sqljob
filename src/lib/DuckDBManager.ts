import {CHART_TYPE_NAMES, stripChartCasts} from './duckdb/chartSql'

        export class DuckDBManager {
            static dbInstance = null;
            static connInstance = null;
            static duckdbModuleRef = null;
            static currentEngine = 'duckdb-wasm'; // 'duckdb-wasm' | 'ducklings'
            static workerRef = null;

            /** Chemin OPFS de la base persistante. */
            static PERSISTENT_DB_PATH = 'opfs://sqljob.db';
            /** true si la base courante est persistée dans OPFS. */
            static usingPersistence = false;

            // Versions et URLs des CDN (chargés dynamiquement selon le moteur)
            static DUCKDB_WASM_VERSION = '1.32.0';
            static DUCKLINGS_VERSION = '1.4.4';

            static getDuckDBWasmUrl() {
                return `https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@${DuckDBManager.DUCKDB_WASM_VERSION}/+esm`;
            }

            static getDucklingsUrl() {
                return `https://cdn.jsdelivr.net/npm/@ducklings/browser@${DuckDBManager.DUCKLINGS_VERSION}/+esm`;
            }

            static getEngine() {
                return DuckDBManager.currentEngine;
            }

            static setEngine(engine) {
                if (!['duckdb-wasm', 'ducklings'].includes(engine)) {
                    throw new Error(`Moteur inconnu: ${engine}`);
                }
                DuckDBManager.currentEngine = engine;
            }

            static async destroy(onStatus) {
                onStatus?.('Destruction de la base de données...', 'loading');

                try {
                    if (DuckDBManager.connInstance) {
                        if (DuckDBManager.currentEngine === 'ducklings') {
                            await DuckDBManager.connInstance.close?.();
                        }
                        DuckDBManager.connInstance = null;
                    }

                    if (DuckDBManager.dbInstance) {
                        if (DuckDBManager.currentEngine === 'ducklings') {
                            await DuckDBManager.dbInstance.close?.();
                        } else {
                            await DuckDBManager.dbInstance.terminate?.();
                        }
                        DuckDBManager.dbInstance = null;
                    }

                    if (DuckDBManager.workerRef) {
                        DuckDBManager.workerRef.terminate?.();
                        DuckDBManager.workerRef = null;
                    }

                    DuckDBManager.duckdbModuleRef = null;
                    DuckDBManager.usingPersistence = false;
                    DuckDBManager._chartTypesInitialized = false;
                    window.duckdbModule = null;
                    window.ducklingsModule = null;

                    onStatus?.('Base de données détruite', 'success');
                } catch (error) {
                    console.error('Erreur destruction DB:', error);
                    onStatus?.('Erreur destruction: ' + error.message, 'error');
                }
            }

            static async switchEngine(newEngine, onStatus) {
                if (newEngine === DuckDBManager.currentEngine && DuckDBManager.dbInstance) {
                    return; // Déjà sur ce moteur et initialisé
                }

                // Détruire l'instance actuelle
                await DuckDBManager.destroy(onStatus);

                // Changer le moteur
                DuckDBManager.setEngine(newEngine);

                // Réinitialiser avec le nouveau moteur
                await DuckDBManager.initDuckDB(onStatus);
            }

            static supportsFileOperations() {
                return DuckDBManager.currentEngine === 'duckdb-wasm';
            }

            static supportsExtensions() {
                return DuckDBManager.currentEngine === 'duckdb-wasm';
            }

            static async initDuckDB(onStatus) {
                if (DuckDBManager.dbInstance && DuckDBManager.connInstance) {
                    return { db: DuckDBManager.dbInstance, conn: DuckDBManager.connInstance };
                }

                if (DuckDBManager.currentEngine === 'ducklings') {
                    return await DuckDBManager._initDucklings(onStatus);
                } else {
                    return await DuckDBManager._initDuckDBWasm(onStatus);
                }
            }

            static async _initDuckDBWasm(onStatus) {
                onStatus?.('Initialisation de DuckDB WASM...', 'loading');

                const duckdb = await import(/* @vite-ignore */ DuckDBManager.getDuckDBWasmUrl());
                window.duckdbModule = duckdb;
                DuckDBManager.duckdbModuleRef = duckdb;

                const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
                const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

                const worker_url = URL.createObjectURL(
                    new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
                );
                const worker = new Worker(worker_url);
                DuckDBManager.workerRef = worker;

                // Créer un logger personnalisé compatible avec Perspective
                const logger = {
                    log(entry) {
                    }
                };

                DuckDBManager.dbInstance = new duckdb.AsyncDuckDB(logger, worker);
                URL.revokeObjectURL(worker_url);

                await DuckDBManager.dbInstance.instantiate(bundle.mainModule, bundle.pthreadWorker);

                // Persistance OPFS : la base survit au rechargement et à la fermeture
                // de l'onglet. Nécessite un contexte sécurisé (https/localhost).
                const canPersist =
                    typeof window !== 'undefined' &&
                    window.isSecureContext &&
                    typeof navigator !== 'undefined' &&
                    !!navigator.storage?.getDirectory;

                if (canPersist) {
                    try {
                        const accessMode = duckdb.DuckDBAccessMode?.READ_WRITE ?? 1;
                        await DuckDBManager.dbInstance.open({
                            path: DuckDBManager.PERSISTENT_DB_PATH,
                            accessMode,
                        });
                        DuckDBManager.usingPersistence = true;
                        onStatus?.('Base persistante OPFS ouverte', 'loading');
                    } catch (err) {
                        console.warn('[DuckDBManager] OPFS indisponible, base en mémoire :', err);
                        DuckDBManager.usingPersistence = false;
                    }
                }

                DuckDBManager.connInstance = await DuckDBManager.dbInstance.connect();

                // Extension excel : nécessaire pour les xlsx. En mode hors ligne,
                // INSTALL échoue sans réseau — on ne bloque pas le démarrage pour autant.
                onStatus?.('Chargement extension Excel...', 'loading');
                try {
                    await DuckDBManager.connInstance.query('INSTALL excel;');
                    await DuckDBManager.connInstance.query('LOAD excel;');
                } catch (err) {
                    console.warn('[DuckDBManager] extension excel indisponible (hors ligne ?) :', err);
                }

                onStatus?.('DuckDB WASM prêt', 'success');

                return { db: DuckDBManager.dbInstance, conn: DuckDBManager.connInstance };
            }

            static async _initDucklings(onStatus) {
                onStatus?.('Initialisation de Ducklings...', 'loading');

                // Ducklings ne fonctionne pas depuis file:// (worker ES module)
                if (location.protocol === 'file:') {
                    onStatus?.('Ducklings nécessite un serveur HTTP. Basculement vers DuckDB WASM...', 'warning');
                    await new Promise(resolve => setTimeout(resolve, 1500));
                    DuckDBManager.currentEngine = 'duckdb-wasm';
                    return await DuckDBManager._initDuckDBWasm(onStatus);
                }

                const ducklings = await import(/* @vite-ignore */ DuckDBManager.getDucklingsUrl());
                window.ducklingsModule = ducklings;
                DuckDBManager.duckdbModuleRef = ducklings;

                const bundle = ducklings.getJsDelivrBundle();
                const worker = await ducklings.createWorker(bundle.mainWorker);
                DuckDBManager.workerRef = worker;

                await ducklings.init({
                    worker,
                    wasmUrl: bundle.wasmModule,
                    wasmJsUrl: bundle.wasmJs
                });

                DuckDBManager.dbInstance = new ducklings.DuckDB();
                DuckDBManager.connInstance = await DuckDBManager.dbInstance.connect();

                onStatus?.('Ducklings prêt', 'success');

                return { db: DuckDBManager.dbInstance, conn: DuckDBManager.connInstance };
            }

            static async executeQuery(query) {
                const qPreview = typeof query === 'string' && query.length > 200 ? query.slice(0, 200) + '...' : query;
                if (!DuckDBManager.connInstance) {
                    throw new Error('DuckDB non initialisé');
                }

                if (DuckDBManager.currentEngine === 'ducklings') {
                    // Ducklings retourne directement un tableau d'objets
                    const result = await DuckDBManager.connInstance.query(query);
                    return result;
                } else {
                    // DuckDB WASM nécessite une conversion
                    const result = await DuckDBManager.connInstance.query(query);
                    return result.toArray().map(row => Object.fromEntries(row));
                }
            }

            // Tous les types taleshape à créer dans DuckDB pour que ::XAXIS etc. fonctionne
            static readonly CHART_TYPE_NAMES = CHART_TYPE_NAMES;

            static _chartTypesInitialized = false;

            /** Crée tous les types taleshape dans DuckDB comme alias VARCHAR.
             *  DuckDB ne supporte que VARCHAR (et ENUM/STRUCT) pour CREATE TYPE —
             *  pas DOUBLE. Les valeurs numériques sont converties via _num() côté parser.
             *  Idempotent : utilise IF NOT EXISTS. */
            static async initChartTypes() {
                if (DuckDBManager._chartTypesInitialized) {
                    return;
                }
                if (DuckDBManager.currentEngine === 'ducklings') {
                    // Ducklings ne supporte pas CREATE TYPE - on skip silencieusement
                    DuckDBManager._chartTypesInitialized = true;
                    return;
                }
                if (!DuckDBManager.connInstance) {
                    return;
                }
                // conn.query() n'accepte qu'une seule instruction par appel dans duckdb-wasm
                for (const t of DuckDBManager.CHART_TYPE_NAMES) {
                    try {
                        await DuckDBManager.connInstance.query(`CREATE TYPE IF NOT EXISTS ${t} AS VARCHAR;`);
                    } catch (err) {
                        console.error('[initChartTypes] FAILED on', t, ':', err?.message ?? err);
                        throw err;
                    }
                }
                DuckDBManager._chartTypesInitialized = true;
            }

            /** Pour Ducklings : extrait les casts ::ROLENAME du SQL et retourne le SQL nettoyé
             *  + la map columnTypes équivalente à ce que DESCRIBE donnerait sur DuckDB WASM.
             *  Ex: "month::XAXIS, revenue::BARCHART AS Rev"
             *   → strippedSql: "month, revenue AS Rev"
             *   → columnTypes: { month: 'XAXIS', Rev: 'BARCHART' } */
            static _stripChartCasts(sql: string) {
                return stripChartCasts(sql);
            }

            /** Exécute une requête et retourne les lignes + les types DuckDB de chaque colonne.
             *  Utilise DESCRIBE pour lire les types (ex: 'XAXIS', 'BARCHART').
             *  columnTypes: { colAlias -> 'XAXIS' | 'BARCHART' | ... } */
            static async executeQueryWithSchema(query) {
                if (!DuckDBManager.connInstance) {
                    throw new Error('DuckDB non initialisé');
                }

                // On extrait les ::ROLENAME (XAXIS, BARCHART…) via regex avant d'exécuter.
                // DESCRIBE retourne le type sous-jacent (VARCHAR) et non le nom du type custom,
                // et nomme les colonnes "CAST(col AS TYPE)" quand il n'y a pas d'alias —
                // donc _stripChartCasts est la seule source fiable des rôles, sur tous les moteurs.
                const { strippedSql, columnTypes } = DuckDBManager._stripChartCasts(query);

                if (DuckDBManager.currentEngine === 'ducklings') {
                    const rows = await DuckDBManager.connInstance.query(strippedSql);
                    return { rows, columnTypes };
                }

                // DuckDB WASM : exécuter le SQL nettoyé (sans ::ROLENAME)
                const result = await DuckDBManager.connInstance.query(strippedSql);
                const rows = result.toArray().map(row => Object.fromEntries(row));
                // Extraire les types réels depuis le schéma Arrow (utilisé par DataTable)
                const schemaTypes: Record<string, string> = {};
                for (const field of result.schema.fields) {
                    schemaTypes[field.name] = String(field.type);
                }
                return { rows, columnTypes, schemaTypes };
            }

            static async registerFile(fileName, file) {
                if (DuckDBManager.currentEngine === 'ducklings') {
                    throw new Error('Ducklings ne supporte pas l\'enregistrement de fichiers. Utilisez DuckDB WASM pour les notebooks avec fichiers.');
                }
                if (!DuckDBManager.dbInstance || !DuckDBManager.duckdbModuleRef) {
                    throw new Error('DuckDB non initialisé');
                }
                await DuckDBManager.dbInstance.registerFileHandle(
                    fileName,
                    file,
                    DuckDBManager.duckdbModuleRef.DuckDBDataProtocol.BROWSER_FILEREADER,
                    true
                );
            }

            static async copyFileToBuffer(fileName) {
                if (DuckDBManager.currentEngine === 'ducklings') {
                    throw new Error('Ducklings ne supporte pas copyFileToBuffer. Utilisez DuckDB WASM.');
                }
                return await DuckDBManager.dbInstance.copyFileToBuffer(fileName);
            }

            /** Attend que le fichier soit disponible dans le système de fichiers virtuel avec retry */
            static async waitForFile(fileName, maxRetries = 10, delayMs = 200) {
                for (let i = 0; i < maxRetries; i++) {
                    try {
                        const buffer = await DuckDBManager.dbInstance.copyFileToBuffer(fileName);
                        if (buffer && buffer.byteLength > 0) {
                            return buffer;
                        }
                    } catch (error) {
                        // Fichier pas encore disponible, on continue
                    }
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                }
                throw new Error(`Le fichier ${fileName} n'est pas disponible après ${maxRetries} tentatives`);
            }

            /** Supprime un fichier du système de fichiers virtuel DuckDB (pour éviter conflits aux prochains exports) */
            static async dropFile(fileName) {
                if (DuckDBManager.currentEngine === 'ducklings' || !DuckDBManager.dbInstance?.dropFile) {
                    return;
                }
                try {
                    await DuckDBManager.dbInstance.dropFile(fileName);
                } catch (e) {
                    console.warn('dropFile ignoré:', e);
                }
            }

            static async executeQueryArrow(query) {
                if (!DuckDBManager.connInstance) {
                    throw new Error('DuckDB non initialisé');
                }

                if (DuckDBManager.currentEngine === 'ducklings') {
                    throw new Error('Ducklings ne supporte pas le format Arrow. Utilisez DuckDB WASM.');
                }

                // DuckDB WASM retourne directement un Arrow Table
                const result = await DuckDBManager.connInstance.query(query);
                return result;
            }

            static getConnection() {
                return DuckDBManager.connInstance;
            }

            static getDatabase() {
                return DuckDBManager.dbInstance;
            }
        }
