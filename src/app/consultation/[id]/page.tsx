// app/consultation/[id]/page.js

// 💡 FIX: Import the necessary Firebase functions for use during build time.
import { collection, getDocs } from 'firebase/firestore';

// 🔑 CRITICAL: You must import your initialized client-side Firestore instance here.
// You used `useFirestore()` in the client component, so you need the underlying export.
// REPLACE '@/firebase/clientApp' with the actual path to your initialized client Firestore object.
import { useFirestore as db } from '@/firebase'; // 🚨 Assuming your client Firestore instance is exported as `firestore` from '@/firebase'

// Import the Client Component
import ConsultationClient from './client'; 

// This function runs on the server at BUILD TIME
export async function generateStaticParams() {
  
  // Use the imported Firestore instance (`db`)
  const callsCollectionRef = collection(db, 'calls');
  const snapshot = await getDocs(callsCollectionRef);

  // Return the array of { id: value } objects
  return snapshot.docs.map((doc) => ({
    id: doc.id, // The document ID is the callId
  }));
}

// This is the Server Component that renders the Client Component
export default function ConsultationPage({
  params,
}: {
  params: { id: string };
}) {
  const callId = params.id; // Get ID directly from params

  // Pass the ID to the Client Component
  return (
    <ConsultationClient callId={callId} />
  );
}