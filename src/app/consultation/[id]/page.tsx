export async function generateStaticParams() {
  // 🚨 IMPORTANT: You need a way to get the firestore instance here.
  // Assuming you have a standard firebase-admin SDK setup for server functions/builds.
  // If you are using an abstraction layer (like your `useFirestore` hook), 
  // you must use the underlying Firestore instance or a direct Admin SDK connection.

  // Placeholder: Replace with your actual server-side Firestore initialization
  const adminFirestore = require('firebase-admin/firestore').getFirestore();

  const callsCollectionRef = collection(adminFirestore, 'calls');
  const snapshot = await getDocs(callsCollectionRef);

  // Return the array of { id: value } objects
  return snapshot.docs.map((doc) => ({
    id: doc.id, // The document ID is the callId
  }));
}