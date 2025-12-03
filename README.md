# ExpressRecorder

Une application web d'enregistrement audio (voix et batterie) construite avec Node.js/Express.js et une interface front-end moderne.

## Fonctionnalités

- 🎤 **Enregistrement vocal** - Enregistrez votre voix directement depuis le navigateur
- 🥁 **Enregistrement batterie** - Enregistrez des rythmes et patterns de batterie
- 👤 **Gestion des utilisateurs** - Système de connexion simple par nom d'utilisateur
- 💾 **Stockage en base de données** - Les enregistrements sont stockés par utilisateur dans une base SQLite
- 📱 **Compatible mobile et PC** - Interface responsive qui fonctionne sur tous les appareils
- 🎧 **Lecture audio** - Écoutez vos enregistrements directement dans l'application
- 🗑️ **Gestion des enregistrements** - Supprimez les enregistrements dont vous n'avez plus besoin

## Installation

1. Clonez le dépôt :
```bash
git clone https://github.com/Callypige/ExpressRecorder.git
cd ExpressRecorder
```

2. Installez les dépendances :
```bash
npm install
```

3. Démarrez le serveur :
```bash
npm start
```

4. Ouvrez votre navigateur et accédez à :
```
http://localhost:3000
```

## Technologies utilisées

- **Backend** : Node.js, Express.js
- **Base de données** : SQLite3
- **Upload de fichiers** : Multer
- **Sessions** : Express-session
- **Frontend** : HTML5, CSS3, JavaScript vanilla
- **API Web** : MediaRecorder API pour l'enregistrement audio

## Structure du projet

```
ExpressRecorder/
├── server.js           # Serveur Express principal
├── database.js         # Configuration de la base de données
├── package.json        # Dépendances et scripts
├── public/             # Fichiers statiques
│   ├── index.html     # Interface utilisateur
│   ├── styles.css     # Styles CSS
│   └── app.js         # Logique front-end
├── uploads/           # Répertoire des enregistrements (généré automatiquement)
└── recordings.db      # Base de données SQLite (généré automatiquement)
```

## Utilisation

1. **Connexion** : Entrez un nom d'utilisateur pour vous connecter (un nouveau compte sera créé automatiquement si nécessaire)

2. **Enregistrement** :
   - Choisissez le type d'enregistrement (Voix ou Batterie)
   - Cliquez sur "Démarrer l'enregistrement"
   - Autorisez l'accès au microphone si demandé
   - Parlez ou jouez votre rythme
   - Cliquez sur "Arrêter l'enregistrement"
   - Écoutez l'aperçu et cliquez sur "Sauvegarder" pour enregistrer

3. **Gestion** :
   - Tous vos enregistrements sont listés dans la section "Mes enregistrements"
   - Utilisez le lecteur audio intégré pour écouter vos enregistrements
   - Cliquez sur "Supprimer" pour effacer un enregistrement

## API Endpoints

- `POST /api/login` - Connexion/création d'utilisateur
- `GET /api/user` - Obtenir l'utilisateur actuel
- `POST /api/logout` - Déconnexion
- `POST /api/recordings` - Upload d'un enregistrement
- `GET /api/recordings` - Liste des enregistrements de l'utilisateur
- `DELETE /api/recordings/:id` - Suppression d'un enregistrement

## Configuration

Le serveur utilise le port 3000 par défaut. Vous pouvez le changer en définissant la variable d'environnement `PORT` :

```bash
PORT=8080 npm start
```

## Développement

Pour le développement, vous pouvez utiliser :

```bash
npm run dev
```

## Licence

ISC