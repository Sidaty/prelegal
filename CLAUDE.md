# Projet Prelegal

## Présentation

Il s'agit d'un produit SaaS permettant aux utilisateurs de rédiger des accords juridiques à partir des modèles du répertoire templates.
L'utilisateur peut converser avec une IA pour déterminer le document souhaité et la façon d'en remplir les champs.
Les documents disponibles sont répertoriés dans le fichier catalog.json à la racine du projet, inclus ici :

@catalog.json

L'implémentation actuelle prend en charge les 11 types de documents via le chat IA, avec une authentification complète des utilisateurs et la persistance des documents.

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
Envisagez de générer le frontend de façon statique et de le servir via SpringBoot, si cela fonctionne.  
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