// server component dont change

// 1. Imports for static generation (uses the client SDK to fetch data at build time)
import { collection, getDocs } from 'firebase/firestore'; 
import { firestore } from '@/firebase'; // 🔑 ASSUMPTION: Replace this with your actual Firestore initialization import path and name.

// Import the Client Component
import ConsultationClient from './client'; 

// This function fixes the build error by telling Next.js which paths to pre-render.
export async function generateStaticParams() {
  // Queries the top-level 'calls' collection for all existing IDs.
  const callsCollectionRef = collection(firestore, 'calls');
  const snapshot = await getDocs(callsCollectionRef);

  // Returns the array of { id: value } objects required by Next.js
  return snapshot.docs.map((doc) => ({
    id: doc.id, 
  }));
}

// This is the Server Component wrapper
export default function ConsultationPage({ 
    params, 
}: { 
    params: { id: string }; 
}) {
    // Extracts the ID from the URL parameters
    const callId = params.id; 

    // Renders the Client Component, passing the URL ID as a prop
    return (
        <ConsultationClient callId={callId} /> 
    );
}