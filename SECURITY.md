# Sécurité

## Modèle

sqljob s'exécute **entièrement dans le navigateur**. Il n'y a ni serveur applicatif, ni compte,
ni télémétrie : les données importées ne quittent pas la machine, sauf si l'utilisateur déclenche
explicitement un partage (Gist) ou charge un notebook depuis une URL.

## Points d'attention

- **Configurations partagées** : un notebook peut contenir du HTML brut exécuté dans une cellule.
  N'ouvrez pas une configuration dont vous ne connaissez pas la provenance.
- **Gists chiffrés** : AES-GCM, clé dérivée par PBKDF2 (600 000 itérations). La phrase de passe n'est
  jamais transmise ; un gist perdu sans sa phrase de passe est irrécupérable.
- **Plugins (à venir)** : les plugins tiers ne sont pas sandboxés. Une déclaration de permissions
  n'est pas une garantie d'exécution — n'installez que des plugins de source connue.

## Signaler une vulnérabilité

Ouvrez un avis privé via l'onglet *Security → Report a vulnerability* du dépôt, ou écrivez à
l'adresse de contact du mainteneur. Merci de ne pas ouvrir d'issue publique avant correction.

## Versions supportées

La dernière version publiée (`main`, tag le plus récent) uniquement.
