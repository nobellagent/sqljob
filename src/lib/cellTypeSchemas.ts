import {markdown} from './cellTypes/markdown'
import {source} from './cellTypes/source'
import {buttonRunNextCells} from './cellTypes/buttonRunNextCells'
import {sql} from './cellTypes/sql'
import {iframe} from './cellTypes/iframe'
import {sqlStat} from './cellTypes/sqlStat'
import {pivot} from './cellTypes/pivot'
import {uiParameter} from './cellTypes/uiParameter'
import {publipostageWord} from './cellTypes/publipostageWord'
import {pdfme} from './cellTypes/pdfme'
import {univerSheet} from './cellTypes/univerSheet'
import {perspective} from './cellTypes/perspective'


export const CELL_TYPE_SCHEMAS = {
            common: {
                name: { label: 'Nom', tooltip: "Identifiant unique (tous types confondus). Pour source = nom de la table SQL (ex: source1). Pour onglets tabsChild = libellé affiché.", placeholder: 'Identifiant unique de la cellule', inputType: 'text', required: true },
                title: { label: 'Titre', tooltip: null, placeholder: null, inputType: 'text' },
                queries: { label: null, inputType: 'textarea', placeholder: null },
                subtitle: { label: 'Description de la stat', tooltip: "Texte descriptif affiché sous le titre de la statistique", placeholder: 'Jan 1st - Feb 1st', inputType: 'text' },
                icon: { label: "Icône (Iconify)", tooltip: "Nom de l'icône Iconify (ex: material-symbols-light:join-right)", placeholder: 'material-symbols-light:join-right', inputType: 'text' },
                buttonLabel: { label: "Label du bouton", tooltip: "Les boutons interrompent le flux d'exécution des cellules ; un clic permet de le reprendre.", placeholder: null, inputType: 'text' }
            },
            types: {
                markdown,
                source,
                buttonRunNextCells,
                sql,
                iframe,
                sqlStat,
                pivot,
                uiParameter,
                publipostageWord,
                pdfme,
                univerSheet,
                perspective,
            }
        };

        // ═══════════════════════════════════════════════════════════════════════════
        // HANDLERS PAR TYPE DE CELLULE (logique spécifique non factorisable)
        // ═══════════════════════════════════════════════════════════════════════════
        export const CELL_TYPE_HANDLERS = {
            uiParameter: {
                onInit(cell, newCell) {
                    if (cell.referenceName && (!cell.name || !String(cell.name).trim())) {
                        newCell.name = String(cell.referenceName).trim();
                    }
                },
                getExportValue(cell, field) {
                    if (field === 'name') return (cell.name || cell.referenceName || '').trim() || undefined;
                    return undefined;
                }
            },
            perspective: {
                onInit(cell, newCell) {
                    if (cell.json?.perspectiveConfig !== undefined) {
                        if (!newCell.json || typeof newCell.json !== 'object') newCell.json = {};
                        newCell.json.perspectiveConfig = cell.json.perspectiveConfig;
                    }
                }
            },
            publipostageWord: {
                onInit(cell, newCell) {
                    if (newCell.buttonLabel === undefined) newCell.buttonLabel = 'Générer les documents';
                }
            },
            pdfme: {
                onInit(cell, newCell) {
                    if (newCell.buttonLabel === undefined) newCell.buttonLabel = '📑 Générer le PDF';
                }
            }
        };
