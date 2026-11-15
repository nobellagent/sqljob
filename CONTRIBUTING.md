# Contribuer

## Branches

| Branche | Rôle | Où elle est publiée |
|---|---|---|
| `main` | production | `https://nobellagent.github.io/sqljob/` (branche `gh-pages`) |
| `next` | intégration | — |

Travail : `feat/…` ou `fix/…` depuis `next`, puis merge dans `next`, puis PR `next` → `main`.
Jamais de commit direct sur `main`.

## Avant de pousser

```bash
npm run typecheck
npm run lint
npm test
```

Ces trois commandes tournent aussi en CI et sont bloquantes. **Ne pas lancer `npm run build:cdn`
localement sur une machine de moins de 8 Go de RAM** : le build demande ~6 Go et se fait en CI.

## Règles de code

1. Un bouton appelle `executeCommand(id, input)` ; la logique métier est dans la commande, pas dans le composant.
2. Pas de nouvel état applicatif sur `window` (seul `window.sqljob` est autorisé).
3. Pas de nouvelle dépendance de rendu si SQLRooms 0.29 fournit déjà l'équivalent.
4. Toute décision d'architecture va dans `ARCHITECTURE.md`, toute rupture utilisateur dans `CHANGELOG.md`.
5. Pas de test modifié pour faire passer un changement de comportement sans le dire dans le message de commit.

## Compiler les connaissances

Une leçon apprise (piège d'API, commande qui casse, contournement) se documente dans
`ARCHITECTURE.md` § « Pièges connus », pas dans un commentaire perdu.
