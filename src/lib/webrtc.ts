'use client';
import {
  Firestore,
  collection,
  doc,
  addDoc,
  getDoc,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

let peerConnection: RTCPeerConnection | null = null;

export const createPeerConnection = (
  firestore: Firestore,
  callId: string,
  onRemoteStream: (stream: MediaStream) => void
) => {
  peerConnection = new RTCPeerConnection(servers);

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      onRemoteStream(event.streams[0]);
    });
  };

  // Listen for local ICE candidates and add them to Firestore
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatesCollection = collection(
        firestore,
        'calls',
        callId,
        'offerCandidates'
      );
      addDoc(candidatesCollection, event.candidate.toJSON());
    }
  };
};

export const startCall = async (
  firestore: Firestore,
  callId: string,
  localStream: MediaStream
) => {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }

  const callDocRef = doc(firestore, 'calls', callId);
  const callDoc = await getDoc(callDocRef);

  if (callDoc.exists() && callDoc.data().offer) {
    // This indicates another user has already started the call.
    // The component logic should catch this and call joinCall instead.
    throw new Error('Call already initiated. Joining instead.');
  }

  localStream.getTracks().forEach((track) => {
    peerConnection!.addTrack(track, localStream);
  });

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(callDocRef, { offer });

  // Listen for the answer
  onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data();
    if (!peerConnection!.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      peerConnection!.setRemoteDescription(answerDescription);
    }
  });

  // Listen for remote ICE candidates
  const answerCandidatesCollection = collection(
    firestore,
    'calls',
    callId,
    'answerCandidates'
  );
  onSnapshot(answerCandidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        peerConnection!.addIceCandidate(candidate);
      }
    });
  });
};

export const joinCall = async (
  firestore: Firestore,
  callId: string,
  localStream: MediaStream
) => {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }

  const callDocRef = doc(firestore, 'calls', callId);
  const callDoc = await getDoc(callDocRef);

  if (!callDoc.exists()) {
    throw new Error("Call doesn't exist!");
  }

  localStream.getTracks().forEach((track) => {
    peerConnection!.addTrack(track, localStream);
  });

  // Listen for remote ICE candidates from the caller
  const offerCandidatesCollection = collection(
    firestore,
    'calls',
    callId,
    'offerCandidates'
  );
  onSnapshot(offerCandidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        peerConnection!.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  const offerDescription = callDoc.data().offer;
  await peerConnection.setRemoteDescription(
    new RTCSessionDescription(offerDescription)
  );

  const answerDescription = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  await updateDoc(callDocRef, { answer });

  // Override onicecandidate for the joiner
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      const candidatesCollection = collection(
        firestore,
        'calls',
        callId,
        'answerCandidates'
      );
      addDoc(candidatesCollection, event.candidate.toJSON());
    }
  };
};