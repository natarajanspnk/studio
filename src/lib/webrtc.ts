
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
let unsubscribeCall: Unsubscribe | null = null;
let unsubscribeCandidates: Unsubscribe | null = null;


export const createPeerConnection = (
  firestore: Firestore,
  callId: string,
  onRemoteStream: (stream: MediaStream) => void
) => {
  peerConnection = new RTCPeerConnection(servers);

  const remoteStream = new MediaStream();
  onRemoteStream(remoteStream);


  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStream.addTrack(track);
    });
  };

  return peerConnection;
};

export const startCall = async (
  peerConnection: RTCPeerConnection,
  firestore: Firestore,
  callId: string,
  localStream: MediaStream
) => {
  if (!peerConnection) {
    throw new Error('Peer connection not initialized');
  }

  const callDocRef = doc(firestore, 'calls', callId);

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });
  
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      const candidatesCollection = collection(firestore, 'calls', callId, 'offerCandidates');
      await addDoc(candidatesCollection, event.candidate.toJSON());
    }
  };

  const offerDescription = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(callDocRef, { offer });

  // Listen for the answer
  unsubscribeCall = onSnapshot(callDocRef, (snapshot) => {
    const data = snapshot.data();
    if (!peerConnection?.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      peerConnection?.setRemoteDescription(answerDescription);
    }
  });

  // Listen for remote ICE candidates
  const answerCandidatesCollection = collection(firestore, 'calls', callId, 'answerCandidates');
  unsubscribeCandidates = onSnapshot(answerCandidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        peerConnection?.addIceCandidate(candidate);
      }
    });
  });
};

export const joinCall = async (
  peerConnection: RTCPeerConnection,
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
    peerConnection.addTrack(track, localStream);
  });
  
  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      const candidatesCollection = collection(firestore, 'calls', callId, 'answerCandidates');
      await addDoc(candidatesCollection, event.candidate.toJSON());
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

  // Listen for remote ICE candidates from the caller
  const offerCandidatesCollection = collection(
    firestore,
    'calls',
    callId,
    'offerCandidates'
  );
  unsubscribeCandidates = onSnapshot(offerCandidatesCollection, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        let data = change.doc.data();
        peerConnection!.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
};

export const hangUp = () => {
    if (unsubscribeCall) {
        unsubscribeCall();
        unsubscribeCall = null;
    }
    if (unsubscribeCandidates) {
        unsubscribeCandidates();
        unsubscribeCandidates = null;
    }
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
}
