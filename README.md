# ExpressRecorder

Application web d'enregistrement vocal avec authentification sécurisée. Construite avec Node.js/Express, TypeScript et interface moderne dark mode.

## ✨ Fonctionnalités

- 🎤 **Enregistrement vocal** - Enregistrez depuis le navigateur (MediaRecorder API)
- 🔐 **Authentification sécurisée** - Inscription/connexion avec bcrypt
- 💾 **Stockage persistant** - Base SQLite + fichiers audio
- 📱 **Design moderne** - Interface dark mode avec glassmorphism
- 🎧 **Gestion complète** - Lecture, sauvegarde, suppression des enregistrements

## 🚀 Installation

```bash
# 1. Cloner le dépôt
git clone https://github.com/Callypige/ExpressRecorder.git
cd ExpressRecorder

# 2. Installer les dépendances
npm install

# 3. Démarrer le serveur
npm start
```

Ouvrez `http://localhost:3000`

## 🛠️ Technologies

- **Backend** : Node.js, Express, TypeScript, bcrypt
- **Database** : SQLite3
- **Frontend** : HTML5, CSS3 (dark mode), JavaScript vanilla
- **Upload** : Multer (50MB max)
- **Session** : express-session (cookies HTTP-only)

## 📁 Structure du projet

```
src/
├── config/
│   └── session.config.ts       # Configuration session
├── middleware/
│   ├── auth.middleware.ts      # Vérification auth
│   └── upload.middleware.ts    # Config Multer
├── routes/
│   ├── auth.routes.ts          # Routes authentification
│   └── recordings.routes.ts    # Routes enregistrements
├── controllers/
│   ├── auth.controller.ts      # Logique auth
│   └── recordings.controller.ts # Logique enregistrements
├── database.ts                 # Config SQLite
├── types.ts                    # Types TypeScript
└── server.ts                   # Point d'entrée (35 lignes)
```

## 🔌 API Endpoints

**Auth**
- `POST /api/register` - Inscription (username, email, password)
- `POST /api/login` - Connexion
- `GET /api/user` - Utilisateur actuel (protégé)
- `POST /api/logout` - Déconnexion

**Recordings**
- `POST /api/recordings` - Upload enregistrement (protégé)
- `GET /api/recordings` - Liste des enregistrements (protégé)
- `DELETE /api/recordings/:id` - Supprimer (protégé)

## ⚙️ Scripts

```bash
npm start      # Compile + démarre le serveur
npm run build  # Compile TypeScript
npm run dev    # Mode développement (ts-node)
npm run watch  # Compilation auto
```

## 🔒 Sécurité

- Mots de passe hashés avec **bcrypt** (10 rounds)
- Sessions **HTTP-only cookies**
- Validation email et mot de passe (min 8 caractères)
- Contraintes UNIQUE sur username/email
- Middleware d'authentification sur routes sensibles

## 📝 Licence

ISC

