import React, { useEffect, useRef, useState } from "react";
import axios from "../api/axios";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    // freestun.net — free public TURN, no registration required
    { urls: "turn:freestun.net:3478", username: "free", credential: "free" },
    { urls: "turn:freestun.net:3479", username: "free", credential: "free" },
    { urls: "turns:freestun.net:5349", username: "free", credential: "free" },
  ],
};

const VideoCall = ({ roomId, callType, isCaller, onClose }) => {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();
  const pcRef = useRef(null);
  const intervalRef = useRef(null);
  const addedCandidates = useRef(new Set());
  const handshakeDone = useRef(false);
  const [status, setStatus] = useState("Connecting...");

  const handleClose = async () => {
    clearInterval(intervalRef.current);
    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.close();
    }
    try { await axios.delete(`/api/call/${roomId}`); } catch (_) {}
    onClose();
  };

  const addNewCandidates = (candidates = []) => {
    const pc = pcRef.current;
    if (!pc || !pc.remoteDescription) return;
    candidates.forEach((c) => {
      const key = JSON.stringify(c);
      if (!addedCandidates.current.has(key)) {
        addedCandidates.current.add(key);
        pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
    });
  };

  useEffect(() => {
    const startCall = async () => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;

      pc.onconnectionstatechange = () => {
        const state = pc.connectionState;
        if (state === "connected") setStatus("Connected");
        else if (state === "disconnected" || state === "failed") setStatus("Disconnected");
      };

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: callType === "video",
          audio: true,
        });
      } catch (err) {
        setStatus("Camera/mic access denied");
        return;
      }

      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = event.streams[0];
      };

      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
            await axios.post(`/api/call/${roomId}/candidate`, { candidate: event.candidate });
          } catch (_) {}
        }
      };

      if (isCaller) {
        const offer = await pc.createOffer();
        // Post offer to DB before setLocalDescription so ICE candidates posted
        // via onicecandidate can never race with the offer POST that resets candidates:[].
        await axios.post(`/api/call/${roomId}/offer`, { offer, callType });
        await pc.setLocalDescription(offer);
        setStatus("Waiting for answer...");

        intervalRef.current = setInterval(async () => {
          try {
            const { data } = await axios.get(`/api/call/${roomId}`);

            if (!handshakeDone.current && data.answer && pc.signalingState === "have-local-offer") {
              await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
              handshakeDone.current = true;
              setStatus("Connecting...");
            }

            addNewCandidates(data.candidates);
          } catch (_) {}
        }, 1000);

      } else {
        setStatus("Connecting to call...");

        intervalRef.current = setInterval(async () => {
          try {
            const { data } = await axios.get(`/api/call/${roomId}`);

            if (!handshakeDone.current && data.offer && pc.signalingState === "stable") {
              await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await axios.post(`/api/call/${roomId}/answer`, { answer });
              handshakeDone.current = true;
              setStatus("Connecting...");
            }

            addNewCandidates(data.candidates);
          } catch (_) {}
        }, 1000);
      }
    };

    startCall();

    return () => {
      clearInterval(intervalRef.current);
      if (pcRef.current) {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
      }
    };
  }, [callType, isCaller, roomId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex flex-col items-center justify-center z-50">
      <div className="relative w-full max-w-3xl bg-gray-900 rounded-lg overflow-hidden">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 text-xs text-gray-400 z-10">{status}</div>
        <button
          onClick={handleClose}
          className="absolute top-2 right-3 text-white font-bold text-xl z-10 hover:text-red-400"
        >
          ✕
        </button>
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-96 rounded bg-gray-800 object-cover" />
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="absolute bottom-3 right-3 w-28 h-28 rounded border-2 border-white object-cover"
        />
      </div>
    </div>
  );
};

export default VideoCall;
