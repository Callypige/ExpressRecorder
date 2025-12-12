# ExpressRecorder

Application web d'enregistrement vocal avec authentification sécurisée. Construite avec Node.js/Express, TypeScript et interface moderne dark mode.

<img width="524" height="403" alt="Capture d’écran 2025-12-11 180502" src="https://github.com/user-attachments/assets/25613368-a8ea-4462-8d3e-3bf92a3abb0c" />

🌐 **Application en ligne** : [https://expressrecorder-production.up.railway.app](https://expressrecorder-production.up.railway.app)

## ✨ Fonctionnalités

- 🎤 **Enregistrement vocal** - Enregistrez depuis le navigateur (MediaRecorder API)
- 🔐 **Authentification sécurisée** - Inscription/connexion avec bcrypt
- ☁️ **Stockage cloud** - Cloudinary pour les enregistrements audio
- 🗄️ **Base de données** - PostgreSQL hébergée sur Railway
- 📱 **Design moderne** - Interface dark mode minimaliste
- ✏️ **Renommage** - Modification des noms d'enregistrements
- 🎧 **Gestion complète** - Lecture, sauvegarde, suppression des enregistrements

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Callypige/ExpressRecorder.git
cd ExpressRecorder

# 2. Installer les dépendances backend
cd backend
npm install

# 3. Configurer les variables d'environnement
# Créer un fichier .env à la racine avec :
# DATABASE_URL=postgresql://...
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...
# SESSION_SECRET=...

# 4. Démarrer le serveur
npm run dev
```

Ouvrez `http://localhost:3000`

## 🛠️ Technologies

- **Backend** : Node.js, Express, TypeScript, bcrypt
- **Database** : PostgreSQL (Railway)
- **Storage** : Cloudinary (audio files)
- **Frontend** : HTML5, CSS3 (dark mode), JavaScript vanilla
- **Session** : express-session + connect-pg-simple
- **Deployment** : Railway

## 🔌 API Endpoints

**Auth**
- `POST /api/register` - Inscription (username, email, password)
- `POST /api/login` - Connexion
- `GET /api/user` - Utilisateur actuel (protégé)
- `POST /api/logout` - Déconnexion

**Recordings**
- `POST /api/recordings` - Upload enregistrement (protégé, JSON metadata)
- `GET /api/recordings` - Liste des enregistrements (protégé)
- `PATCH /api/recordings/:id` - Renommer un enregistrement (protégé)
- `DELETE /api/recordings/:id` - Supprimer (protégé)

## ⚙️ Scripts

```bash
# Depuis la racine
npm run dev      # Lance le serveur en développement
npm run build    # Compile le backend TypeScript
npm start        # Lance le serveur en production

# Depuis backend/
npm run dev      # ts-node src/server.ts
npm run build    # tsc
npm start        # node dist/server.js
```

## 🚢 Déploiement Railway

L'application est déployée sur Railway avec :
- PostgreSQL database
- Cloudinary pour le stockage des fichiers
- Variables d'environnement configurées
- Build automatique depuis GitHub
- Upload direct vers Cloudinary (évite timeout Railway 60s)
- Variables d'environnement pour les secrets

## 📝 Licence

ISC

