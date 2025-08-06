# To Do List - Full Stack Application (React + Express + MongoDB)

## Description

**To Do List** est une application de gestion de tâches complète développée en **React** (Frontend) et **Express** avec **MongoDB** (Backend). L'application permet à un utilisateur de gérer ses tâches, de les marquer comme terminées, de les modifier, de les dupliquer, et de les supprimer. L'authentification est sécurisée via **JWT** (JSON Web Token), garantissant ainsi une gestion sécurisée des utilisateurs.

Ce projet démontre mes compétences en développement **full stack**, avec une attention particulière à l'architecture du code, à la gestion des erreurs, à la sécurité et à la fluidité des interactions utilisateurs.

## Fonctionnalités

### Côté Client (Frontend)

- **Inscription / Connexion** avec authentification via token JWT.
- **Création, édition, suppression et duplication des tâches**.
- **Marquage des tâches comme terminées**.
- **Réorganisation des tâches** via drag-and-drop.
- **Gestion de l’état d’authentification** et stockage du token dans le `localStorage`.

### Côté Serveur (Backend)

- **Authentification et gestion des utilisateurs** avec JWT.
- **Création, récupération, mise à jour et suppression de tâches**.
- **Gestion des tâches complétées**.
- **API sécurisée** avec authentification basée sur JWT.
- **Connexion à MongoDB** pour la gestion des données des utilisateurs et des tâches.

## Architecture du projet

L'architecture suit une approche **full stack** avec **React** pour le frontend et **Express.js** pour le backend, connectés via une API REST. Les données sont stockées dans une base de données **MongoDB**.

  ```bash
  /client # Frontend (React)
    /src
      /components # Composants réutilisables
      /hooks # Hooks personnalisés
      /pages # Pages (Login/Register, TodoApp)
      /services # Services pour API
      /styles # Styles CSS
      /types # Types TypeScript
      /utils # Utilitaires

  /server # Backend (Express + MongoDB)
    /src
      /config # Configurations
      /controllers # Contrôleurs pour la gestion des requêtes
      /middleware # Middleware pour l'authentification et les erreurs
      /models # Modèles pour la gestion des données
      /routes # Routes de l'API
      /services # Logique métier pour les utilisateurs et les tâches
      /types # Types TypeScript pour le backend
      /utils # Utilitaires
  ```

## Technologies utilisées

### Frontend

- **React** pour l'interface utilisateur dynamique.
- **TypeScript** pour une gestion stricte des types.
- **Axios** pour la gestion des requêtes HTTP.
- **CSS** pour la mise en forme, avec des classes modulaires.
- **Vite** comme bundler pour un développement rapide.

### Backend

- **Express** pour créer une API REST.
- **MongoDB** pour stocker les données des utilisateurs et des tâches.
- **JWT (JSON Web Token)** pour l'authentification sécurisée des utilisateurs.
- **bcryptjs** pour sécuriser les mots de passe.
- **Helmet** et **CORS** pour la sécurité de l'application.
- **dotenv** pour la gestion des variables d'environnement.

## Installation

### Prérequis

- **Node.js** (version >=14.x)
- **pnpm** (gestionnaire de paquets)
- **MongoDB** (ou une instance MongoDB accessible via une URL de connexion)

### Étapes d'installation

1.**Clonez le dépôt :**

  ```bash
  git clone https://github.com/Addey34/To-Do-List.git
  ```

2.**Allez dans le répertoire du projet :**

  ```bash
  cd To-Do-List
  ```

3.**Installer les dépendances pour le frontend et le backend :**

  ```bash
  pnpm install
  ```

4.**Configurez votre environnement :**
  Créez les fichiers `.env` à la racine du projet et ajoutez les variables suivantes :

  ```bash
  VITE_API_URL=http://localhost:5500
  JWT_SECRET=your-secret-key
  PORT=5500
  MONGO_CONNECT_URL=mongodb://localhost:27017/tasklist
  ALLOWED_ORIGINS=http://localhost:3000
  ```

5.**Lancer le frontend et le backend :**

  ```bash
  pnpm run dev
  ```

L'application sera accessible sur [Frontend](http://localhost:3000) et [Backend](http://localhost:5500).

### Routes API

#### Authentification

-- POST /api/auth/register : Inscription d'un utilisateur.
-- POST /api/auth/login : Connexion d'un utilisateur.

#### Tâches

-- GET /api/tasks : Récupérer toutes les tâches de l'utilisateur connecté.
-- POST /api/tasks : Créer une nouvelle tâche.
-- PUT /api/tasks/:taskId : Mettre à jour une tâche.
-- DELETE /api/tasks/:taskId : Supprimer une tâche.
-- POST /api/tasks/:taskId/complete : Marquer une tâche comme terminée.

#### Tâches terminées

-- GET /api/completedTasks : Récupérer toutes les tâches terminées.
-- DELETE /api/completedTasks/:taskId : Supprimer une tâche terminée.

#### Sécurisation

- JWT (JSON Web Token) : L'authentification est gérée via des tokens JWT, garantissant que seules les requêtes authentifiées peuvent accéder aux routes protégées.

- CORS : Le CORS est configuré pour permettre uniquement les connexions provenant des origines autorisées définies dans .env.

#### Développement

Scripts

Frontend && Backend :

  ```bash
  pnpm run dev : # Lancer le serveur de développement et le serveur.
  pnpm run build : # Construire le projet pour la production.
  ```

### Contributions

Les contributions sont les bienvenues ! Si vous souhaitez ajouter de nouvelles fonctionnalités ou améliorer l'existant, veuillez soumettre une pull request. Assurez-vous d'expliquer clairement vos modifications dans le message de la PR.

### Licence

Distribué sous la licence MIT. Voir le fichier LICENSE pour plus de détails.
