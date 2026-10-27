# Projet Prelegal

## Présentation

Il s'agit d'un produit SaaS permettant aux utilisateurs de rédiger des accords juridiques à partir des modèles du répertoire templates.
L'utilisateur peut converser avec une IA pour déterminer le document souhaité et la façon d'en remplir les champs.
Les documents disponibles sont répertoriés dans le fichier catalog.json à la racine du projet, inclus ici :

@catalog.json

Les 11 types de documents sont pris en charge via le chat IA, avec une authentification des utilisateurs et un historique des documents. Voir « État actuel », « Décisions clés » et « Pièges connus » en fin de fichier.

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

## État actuel (27 octobre 2026)

Livré sur `main` : fondation V1 (issue #9, PR #13 et #14), chat IA (issues #10 et #11, PR #15 et #16), comptes et historique (issue #12, PR #17), délai d'expiration Gemini (PR #18).

Parcours utilisateur :
- `/` (connexion) et `/signup/` (inscription).
- `/app/` : liste des documents de l'utilisateur.
- `/app/document/` (nouveau) ou `/app/document/?id=…` (reprise). L'utilisateur décrit son besoin dans le chat ; l'IA choisit l'un des 11 types avec lui, puis pose les questions et remplit le document. L'aperçu se met à jour à chaque réponse, avec un téléchargement PDF.
- Si le document demandé n'est pas supporté, l'IA l'explique et propose le plus proche.
- Avertissement « brouillon, soumis à revue juridique » au-dessus de l'aperçu et en pied de chaque page du PDF.

Plan du code :
- `documents.json` (racine) : les 11 types (id, templates, rôles des parties, termes clés et leur description pour l'IA). Source unique, lue par le backend (classpath, `DocumentCatalog`) et le frontend (import).
- Backend `com.prelegal` :
  - `chat/` : `POST /api/chat` (`DocumentChatService`, `GeminiConfig`, `resources/chat/response-schema.json` et `system-prompt.txt`).
  - `user/` : `AuthController` (`/api/auth/register|login|me`), entité `User`.
  - `document/` : `DocumentController` (`/api/documents`), entité `SavedDocument` (type, titre, brouillon et conversation en JSON).
  - `SecurityConfig`, `StaticFrontendConfig`, `HealthController`.
- Frontend `src/` :
  - `lib/` : `api.ts` (fetch, CSRF, 401), `auth.ts`, `history.ts`, `chat.ts`, `documents.ts` (catalogue, page « Key Terms », formatage des conditions), `nda.ts` (page de garde officielle du NDA), `markdown.ts`.
  - `components/` : `AuthForm`, `AuthLayout`, `AppShell`, `DocumentList`, `DocumentCreator`, `DocumentChat`, `DocumentPreview`, `DocumentPdf`.

Tests : `cd backend && mvn test` et `cd frontend && npm test` (lint : `npm run lint`). Les tests réels vers Gemini sont opt-in car ils consomment du quota : `cd backend && set -a && . ../.env && set +a && GEMINI_LIVE_TEST=true mvn test -Dtest=DocumentChatLiveTests`. Ils passent sur `gemini-3.5-flash` (`GEMINI_MODEL=gemini-3.5-flash`) ; **reste à les faire passer sur `gemini-3.8-flash`**, indisponible au moment de la validation.

## Décisions clés

- **Un seul conteneur, un seul port** : Next.js est exporté en statique (`output: "export"`, `trailingSlash`) et servi par Spring Boot. `cacheComponents` et PPR sont désactivés, car incompatibles avec l'export. L'id d'un document passe en paramètre de requête (`?id=`), faute de routes dynamiques.
- **Base temporaire** : SQLite avec `ddl-auto=create`, recréée à chaque démarrage, comme le permet le cahier des charges.
- **Chat sans état côté serveur** : le navigateur envoie toute la conversation et le document à chaque tour. Gemini renvoie le document **complet** (pas un patch), ce qui simplifie le front.
- **Structured Outputs, pas de function calling** : un schéma unique pour tous les types ; les enums des types et des clés de termes sont injectés au démarrage depuis `documents.json`, pour que le schéma ne diverge jamais du catalogue.
- **`documents.json` rédigé à la main** plutôt qu'extrait des templates : les templates n'ont pas de page de garde (sauf le NDA), et l'IA a besoin de descriptions et d'exemples.
- **Page « Key Terms » générée** pour les 10 documents sans page de garde ; le Mutual NDA garde sa page officielle via l'adaptateur `toNdaData`.
- **Templates chargés à la demande** depuis `/templates/` (copiés dans `public/` par `copy-templates`, script Node pour marcher aussi sous Windows) plutôt qu'embarqués dans le HTML (environ 270 Ko).
- **Authentification par session** (Spring Security, BCrypt, `csrf.spa()`) plutôt que JWT : même origine, et les sessions disparaissent de toute façon au redémarrage. La connexion passe par un contrôleur JSON qui change l'id de session et enregistre explicitement le contexte.
- **Historique séparé du chat** : `/api/documents` est un CRUD distinct, appelé par le front après chaque réponse dès qu'un type est choisi. Les sauvegardes sont enchaînées l'une après l'autre (`useRef`), pour éviter un doublon ou l'écrasement d'une version récente.
- **Gemini en échec rapide** : une seule tentative (le défaut du SDK faisait 5 requêtes en environ 33 s) et un délai de 60 s. L'utilisateur renvoie simplement son message.
- **Nommage** : en TypeScript, le type est `LegalDocument` et les variables `draft`, pour ne pas entrer en collision avec le `Document` du DOM et celui de react-pdf. En Java, le record reste `Document`.
- **Design** : palette du projet en tokens Tailwind (plus `surface` et `line`), Geist pour l'interface et une serif pour le document, liste en lignes plutôt qu'en cartes. Le jaune est réservé au trait de signature (motif du panneau de connexion).

## Pièges connus

- **Cookies localhost** : les autres applis sur `localhost` envoient leurs cookies sur le port 8000 et dépassaient les 8 Ko d'en-têtes de Tomcat (erreur 400). La limite est portée à 64 Ko.
- **BCrypt** limite les mots de passe à 72 octets : Spring Security 7 lève une exception au-delà. Les mots de passe sont donc limités à 8 à 72 caractères, en vérifiant les octets.
- **Quota Gemini gratuit** : 20 requêtes par jour et par modèle ; Google vérifie le quota avant de valider le schéma. `gemini-3.8-flash` a renvoyé des 503 et, le 27 octobre 2026, n'a plus répondu du tout pendant plusieurs minutes.
- **Gemini et JSON Schema** : seul un sous-ensemble est supporté. `pattern` est absent ; `format: "date"`, `anyOf`, `enum`, `$ref` et `$defs` fonctionnent.
- **Tests Spring** : les classes de test partagent le même contexte, donc la même base. Ne jamais supposer une table vide. MockMvc ne suit pas les forwards et ne passe pas par le parseur d'en-têtes de Tomcat (utiliser un vrai serveur pour ça). Après un renommage de test, lancer `mvn clean test` pour ne pas lire un vieux rapport.
- **Turbopack** n'importe rien hors de sa racine : d'où `turbopack.root` sur la racine du dépôt.
- **Scripts macOS** : bash 3.2 échoue sur un tableau vide avec `set -u` (les scripts `start-*` utilisent `set -eo pipefail`) ; `sed` ne connaît pas `\b` (utiliser `perl`) ; `timeout` n'existe pas.
