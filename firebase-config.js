/* ============================================================
   FIREBASE PROJECT CONFIG — EDIT HERE
   1. Go to console.firebase.google.com > Add project (free "Spark" plan
      is enough for learner accounts + saved sketches).
   2. In Project settings > General > Your apps, add a Web app and copy
      the config values below.
   3. In Build > Authentication > Sign-in method, enable "Email/Password".
   4. In Build > Firestore Database, create a database (production mode)
      and paste these rules under Rules so learners can only read/write
      their own data:

      rules_version = '2';
      service cloud.firestore {
        match /databases/{database}/documents {
          match /users/{userId} {
            allow read, write: if request.auth != null && request.auth.uid == userId;
            match /sketches/{sketchId} {
              allow read, write: if request.auth != null && request.auth.uid == userId;
            }
          }
        }
      }

   Nothing else in the site needs to change once these are filled in.
   ============================================================ */
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCZMVRzf424USBfiugETwZfL5Lh9RiQCkQ",
  authDomain: "jal-db.firebaseapp.com",
  projectId: "jal-db",
  storageBucket: "jal-db.firebasestorage.app",
  messagingSenderId: "768171532348",
  appId: "1:768171532348:web:dff331ad5efac55371a339"
};
