
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
  Unsubscribe,
  DocumentReference,
} from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export const createPeerConnection = (
  onTrack: (event: RTCTrackEvent) => void
): RTCPeerConnection => {
  const pc = new RTCPeerConnection(servers);
  pc.ontrack = onTrack;
  return pc;
};

export const startCall = async (
  peerConnection: RTCPeerConnection,
  firestore: Firestore,
  callId: string,
  localStream: MediaStream,
  onIceCandidate: (candidate: RTCIceCandidate) => void
): Promise<() => void> => {

  const callDocRef = doc(firestore, 'calls', callId);
  const answerCandidatesCollection = collection(firestore, 'calls', callId, 'answerCandidates');

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(callDocRef, { offer }, { merge: true });

  const unsubscribeCall = onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data();
    if (!peerConnection.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      peerConnection.setRemoteDescription(answerDescription);
    }
  });

  const unsubscribeCandidates = onSnapshot(answerCandidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        peerConnection.addIceCandidate(candidate);
      }
    });
  });

  return () => {
    unsubscribeCall();
    unsubscribeCandidates();
  };
};

export const joinCall = async (
  peerConnection: RTCPeerConnection,
  firestore: Firestore,
  callId: string,
  localStream: MediaStream,
  onIceCandidate: (candidate: RTCIceCandidate) => void
): Promise<() => void> => {

  const callDocRef = doc(firestore, 'calls', callId);
  const offerCandidatesCollection = collection(firestore, 'calls', callId, 'offerCandidates');
  
  const callDoc = await getDoc(callDocRef);

  if (!callDoc.exists()) {
    throw new Error("Call doesn't exist!");
  }

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      onIceCandidate(event.candidate);
    }
  };

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

  const unsubscribeCandidates = onSnapshot(offerCandidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        peerConnection.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  return () => {
    unsubscribeCandidates();
  }
};
