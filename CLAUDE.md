# Projet Prelegal

## Présentation

Il s'agit d'un produit SaaS permettant aux utilisateurs de rédiger des accords juridiques à partir des modèles du répertoire templates.
L'utilisateur peut converser avec une IA pour déterminer le document souhaité et la façon d'en remplir les champs.
Les documents disponibles sont répertoriés dans le fichier catalog.json à la racine du projet, inclus ici :

@catalog.json

Les 11 types de documents sont pris en charge via le chat IA. L'objectif inclut aussi une authentification complète des utilisateurs et la persistance des documents. Voir « État d'implémentation » en fin de fichier pour ce qui existe déjà.

## Processus de développement

Lorsqu'on vous demande de développer une fonctionnalité :
1. Utilisez vos outils GitHub pour lire les instructions de la fonctionnalité dans les issues de GitHub
2. Développez la fonctionnalité - ne sautez aucune étape du processus feature-dev en 7 étapes
3. Testez minutieusement la fonctionnalité avec des tests unitaires et des tests d'intégration, et corrigez tout problème
4. Soumettez une PR à l'aide de vos outils GitHub

## Conception IA

Lorsque vous écrivez du code qui appelle des LLM, utilisez le modèle Gemini 3.8 Flash. Vous devez utiliser les Structured Outputs afin de pouvoir interpréter les résultats et remplir les champs du document juridique.

Une clé GEMINI_API_KEY se trouve dans le fichier .env à la racine du projet.

## Conception technique

L'ensemble du projet doit être empaqueté dans un conteneur Docker.  
Le backend doit se trouver dans backend/ et être un projet Java utilisant SpringBoot.  
Le frontend doit se trouver dans frontend/  
La base de données doit utiliser SQLite et être recréée à partir de zéro à chaque démarrage du conteneur Docker, avec une table users permettant l'inscription et la connexion.  
Le frontend est exporté de façon statique et servi par SpringBoot.  
Des scripts doivent être présents dans scripts/ pour :
```bash
# Mac
scripts/start-mac.sh    # Démarrer
scripts/stop-mac.sh     # Arrêter

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend disponible sur http://localhost:8000

## Palette de couleurs
- Jaune d'accent : `#ecad0a`
- Bleu principal : `#209dd7`
- Violet secondaire : `#753991` (boutons de soumission)
- Bleu marine foncé : `#032147` (titres)
- Texte gris : `#888888`

Ces couleurs sont définies comme tokens Tailwind dans `frontend/src/app/globals.css` : `accent`, `primary`, `submit`, `navy`, `muted`.

## État d'implémentation

Fondation V1 en place (issue #9, PR #13 et #14) :
- **Backend** : Spring Boot 4.1.2, Java 25, Maven, JPA/Hibernate sur SQLite (`hibernate-community-dialects`). `ddl-auto=create` recrée la table `users` à chaque démarrage (entité `User`, `UserRepository`). Endpoint `GET /api/health`. `StaticFrontendConfig` sert `<route>/index.html` pour les routes exportées. La limite des en-têtes HTTP est portée à 64KB, car les cookies des autres applis sur localhost provoquaient des erreurs 400.
- **Frontend** : Next.js 16 avec `output: "export"` et `trailingSlash`. `cacheComponents` et PPR sont désactivés car incompatibles avec l'export. `turbopack.root` pointe sur la racine du dépôt pour importer `documents.json`. Le script `copy-templates` (lancé avant `dev` et `build`) copie `templates/` dans `public/templates`, chargés à la demande.
- **Pages** :
  - `/` : faux login, sans authentification ; toute saisie mène à `/app/`.
  - `/app/` : créateur de documents (chat IA, aperçu, téléchargement PDF). L'utilisateur choisit le type de document dans le chat.
- **Chat IA** (issues #10 et #11, PR #15) :
  - Fonctionnement : `POST /api/chat` reçoit `{messages, document}` (l'état vit dans le navigateur, le backend est sans état). `DocumentChatService` appelle `gemini-3.8-flash` (SDK `google-genai`) en Structured Output et renvoie `{reply, document}`. Le document a la forme `{type, party1, party2, terms: [{key, value}]}`, et le front (`DocumentChat`) remplace son état par celui renvoyé.
  - `documents.json` (racine du dépôt) est la source unique des types : id, templates, rôles des parties, termes clés avec leur description. Le backend le lit depuis le classpath (`DocumentCatalog`), le frontend l'importe.
  - Fichiers : le schéma est dans `backend/src/main/resources/chat/response-schema.json`. Ses placeholders `{documentTypes}` et `{termKeys}` sont remplis au démarrage. Le prompt système est dans `chat/system-prompt.txt` : il liste le catalogue, guide l'utilisateur et propose le document le plus proche quand un type n'est pas supporté. Gemini ne supporte qu'un sous-ensemble de JSON Schema (`pattern` n'en fait pas partie).
  - Rendu : le Mutual NDA garde sa page de garde officielle (`fillCoverPage(toNdaData(draft))`). Les autres documents reçoivent une page « Key Terms » générée (`buildKeyTermsPage`), suivie des conditions standard (`formatStandardTerms`).
  - Les nouvelles tentatives du SDK sont désactivées (`GeminiConfig`) : elles prenaient environ 30 s et consommaient le quota gratuit (20 requêtes/jour).
- **Docker** : `Dockerfile` multi-stage (export Node, package Maven, JRE 25). Les deux étapes de build copient `documents.json` (et `templates/` pour le frontend) dans `/build`, la racine du dépôt dans l'image. Les scripts `scripts/start-*` passent `.env` au conteneur s'il existe.
- **Tests** : `cd backend && mvn test`, `cd frontend && npm test`. Le test réel vers Gemini est opt-in, car il consomme du quota : `GEMINI_LIVE_TEST=true mvn test -Dtest=DocumentChatLiveTests`.

Pas encore implémenté : authentification réelle, persistance des documents.