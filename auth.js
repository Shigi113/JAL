/* ============================================================
   Shared learner-account helpers.
   Include AFTER these, in this order:
     firebase-app-compat.js
     firebase-auth-compat.js
     firebase-firestore-compat.js
     firebase-config.js
     auth.js  (this file)

   Exposes window.JALAuth with:
     .ready                        true once Firebase initialised
     .onAuthChange(cb)             cb(user|null) on every auth change
     .signUp(name, email, pass)    -> Promise<user>
     .signIn(email, pass)          -> Promise<user>
     .signOutUser()                -> Promise
     .saveSketch(uid, sketch)      sketch: {id?, name, code, preset}
     .loadSketches(uid)            -> Promise<Array<sketch>>
     .loadSketch(uid, id)          -> Promise<sketch|null>
     .deleteSketch(uid, id)        -> Promise
   If Firebase config hasn't been filled in yet, JALAuth.ready is false
   and every method rejects with a clear message instead of throwing —
   pages should check .ready before showing account UI as active.
   ============================================================ */
(function () {
  const notConfigured = () => Promise.reject(new Error(
    'Learner accounts are not set up yet. See firebase-config.js.'
  ));

  if (typeof firebase === 'undefined' || typeof FIREBASE_CONFIG === 'undefined' ||
      FIREBASE_CONFIG.apiKey.indexOf('PASTE_') !== -1) {
    window.JALAuth = {
      ready: false,
      onAuthChange: (cb) => cb(null),
      signUp: notConfigured,
      signIn: notConfigured,
      signOutUser: notConfigured,
      saveSketch: notConfigured,
      loadSketches: () => Promise.resolve([]),
      loadSketch: () => Promise.resolve(null),
      deleteSketch: notConfigured
    };
    return;
  }

  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db = firebase.firestore();

  function signUp(name, email, password) {
    return auth.createUserWithEmailAndPassword(email, password).then((cred) => {
      return db.collection('users').doc(cred.user.uid).set({
        name: name,
        email: email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => cred.user.updateProfile({ displayName: name })).then(() => cred.user);
    });
  }

  function signIn(email, password) {
    return auth.signInWithEmailAndPassword(email, password).then((cred) => cred.user);
  }

  function signOutUser() { return auth.signOut(); }

  function onAuthChange(cb) { return auth.onAuthStateChanged(cb); }

  function saveSketch(uid, sketch) {
    const coll = db.collection('users').doc(uid).collection('sketches');
    const ref = sketch.id ? coll.doc(sketch.id) : coll.doc();
    return ref.set({
      name: sketch.name,
      code: sketch.code,
      preset: sketch.preset || null,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(() => ref.id);
  }

  function loadSketches(uid) {
    return db.collection('users').doc(uid).collection('sketches')
      .orderBy('updatedAt', 'desc').get()
      .then((snap) => snap.docs.map((d) => Object.assign({ id: d.id }, d.data())));
  }

  function loadSketch(uid, id) {
    return db.collection('users').doc(uid).collection('sketches').doc(id).get()
      .then((doc) => (doc.exists ? Object.assign({ id: doc.id }, doc.data()) : null));
  }

  function deleteSketch(uid, id) {
    return db.collection('users').doc(uid).collection('sketches').doc(id).delete();
  }

  window.JALAuth = {
    ready: true, auth, db, signUp, signIn, signOutUser, onAuthChange,
    saveSketch, loadSketches, loadSketch, deleteSketch
  };
})();
