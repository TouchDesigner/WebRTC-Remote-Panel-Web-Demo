// Import the webrtc shim to ensure maintaining features despite browser implementation changes
// It's important to keep this line but it's not used in the code.
// eslint-disable-next-line  no-unused-vars
import adapter from 'webrtc-adapter';

/*
* WEBRTC SETUP
* Uses Mozilla's Perfect Negotiation pattern https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation
*/
class WebRTCConnection {
    constructor(signalingClient, reactSetMouseDataChannelHandler, reactSetKeyboardDataChannelHandler) {
        this.signalingClient = signalingClient;
        // Ensure signaling client has access to this instance to delegate messages
        this.signalingClient.setWebRTCConnection(this);

        this.reactSetMouseDataChannelHandler = reactSetMouseDataChannelHandler;
        this.reactSetKeyboardDataChannelHandler = reactSetKeyboardDataChannelHandler;
        
        this.mediaConstraints = {
            audio: true,
            video: true,
        };
        // Perfect negotiation specific
        this.polite = false;
        this.makingOffer = false;
        this.ignoreOffer = false;
        this.isSettingRemoteAnswerPending = false;


        this.onMessageReceivedIce.bind(this);
    }
    
    createPeerConnection() {
        this.peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        });
        
        // Assing event handlers to the peerConnection, bind (this) if the function calls object features in it
        this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange.bind(this);
        this.peerConnection.ondatachannel = this.handleDataChannel;
        this.peerConnection.onicecandidate = this.handleIceCandidate.bind(this);
        this.peerConnection.onicecandidateerror = this.handleIceCandidateError.bind(this);
        this.peerConnection.oniceconnectionstatechange = this.handleIceConnectionStateChange.bind(this);
        this.peerConnection.onicegatheringstatechange = this.handleIceGatheringStateChange.bind(this);
        this.peerConnection.onnegotiationneeded = this.handleNegotiationNeeded.bind(this);
        this.peerConnection.onsignalingstatechange = this.handleSignalingStateChange.bind(this);
        this.peerConnection.ontrack = this.handleTrack;
        this.peerConnection.removeTrack = this.handleRemoveTrack.bind(this);
        
        // Initialize remoteStream on remoteVideo HTML element
        var remoteStream = new MediaStream();
        var remoteVideo = document.getElementById("remoteVideo");
        remoteVideo.srcObject = remoteStream;
        
        this.mouseDataChannel = this.peerConnection.createDataChannel('MouseData');
        this.reactSetMouseDataChannelHandler(this.mouseDataChannel);
        
        this.keyboardDataChannel = this.peerConnection.createDataChannel('KeyboardData');
        this.reactSetKeyboardDataChannelHandler(this.keyboardDataChannel);
    }
    
    deletePeerConnection() {
        var remoteVideo = document.getElementById("remoteVideo");
        
        // No need to remove handlers, is this linked to exemples?
        if (this.peerConnection) {
            this.peerConnection.onconnectionstatechange = null;
            this.peerConnection.ondatachannel = null;
            this.peerConnection.onicecandidate = null;
            this.peerConnection.onicecandidateerror = null;
            this.peerConnection.oniceconnectionstatechange = null;
            this.peerConnection.onicegatheringstatechange = null;
            this.peerConnection.onnegotiationneeded = null;
            this.peerConnection.onsignalingstatechange = null;
            this.peerConnection.ontrack = null;
            this.peerConnection.removeTrack = null;
            
            if (remoteVideo.srcObject) {
                remoteVideo.srcObject.getTracks().forEach(track => track.stop());
            }    
            
            this.mouseDataChannel.close();
            this.keyboardDataChannel.close();
            
            this.peerConnection.close();
        }
        
        remoteVideo.removeAttribute("src");
        remoteVideo.removeAttribute("srcObject");
    }

    onCallStart(address, properties) {
        // Assign the remote address as a target reference
		this.target = address;

        // For polite WebRTC negotiation, we need to make sure the webapp has not been there longer than the remote client
		this.polite = this.signalingClient.properties.timeJoined < properties.timeJoined

		this.createPeerConnection()
				
		this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
	}

	onCallEnd() {
		this.deletePeerConnection();
	}
    
    handleConnectionStateChange(event) {
        console.log('[WEBRTC] Connection State Change: ', event);

        if(event.target.connectionState === 'disconnected')
            this.deletePeerConnection();
    }
    
    handleDataChannel(rtcDataChannelEvent) {
        console.log('[WEBRTC] RTCDataChannel Event: ', rtcDataChannelEvent);
    }
    
    handleIceCandidate(event) {
        // Get connection if unavailable, so that target can be filled, hacked in at the moment
        console.log('[WEBRTC] New ICE Candidate: ', event);
        if (event.candidate) { 
            this.onMessageSendingIce(
                this.target,
                event.candidate.candidate,
                event.candidate.sdpMLineIndex,
                event.candidate.sdpMid
            );
        }
    }
        
    handleIceCandidateError(event) {
        console.log('[WEBRTC] ICE Candidate Error: ', event)
    }
    
    handleIceConnectionStateChange(event) {
        switch (this.peerConnection.iceConnectionState) {
            case "default":
                break;
            case "closed":
                break;
            case "failed":
                this.peerConnection.restartIce();
                break;
            default:
                console.log("[WEBRTC] No matching iceConnectionState" + event);
        }
    }
        
    handleIceGatheringStateChange(event) {
        console.log('[WEBRTC] Gathering state changed to ', event);
    }
        
    handleNegotiationNeeded(event) {
        console.log('[WEBRTC] Negotiation needed: ', event);
        
        if (this.peerConnection.signalingState === 'have-remote-offer') {
            console.log('[WEBRTC] Already have a remote offer, exiting.')
            return;
        }
        
        if (this.makingOffer) {
            console.log('[WEBRTC] Already making an offer, exiting.')
            return;
        }
        
        try {
            this.makingOffer = true;
            this.peerConnection.setLocalDescription()
            .then(() => {
                this.onMessageSendingOffer(
                    this.target,
                    this.peerConnection.localDescription.sdp
                );
            });
        } catch (err) {
            console.error(err);
        } finally {
            this.makingOffer = false;
        }
    }

    handleSignalingStateChange(event) {
        console.log('[WEBRTC] Signaling State Change: ', event, event.currentTarget.signalingState);
    }
    
    handleTrack(event) {
        console.log('[WEBRTC] New Track Event: ', event);
        document.getElementById("remoteVideo").srcObject.addTrack(event.track);
    }
            
    handleRemoveTrack(event) {
        console.log('[WEBRTC] Remove track event: ', event);
        var remoteStream = document.getElementById("remoteVideo").srcObject;
        var trackList = remoteStream.getTracks();
        
        if (trackList.length === 0) {
            this.deletePeerConnection();
        }
    }
            
    /*
    Signaling WebRTC Messages Specifics, Received
    */
    onMessageReceived(messageObj) {
        var fnName = 'onMessageReceived' + messageObj.signalingType;
        var fnToCall = this[fnName].bind(this);
        
        if (fnToCall === undefined) {
            console.log('The function ' + fnName + ' is not implemented in WebRTC.')
        } else {
            fnToCall(messageObj);
        }
    }
            
    onMessageReceivedOffer(messageObj) {
        /*
        An offer was received from another client through the Signaling client
        It should be ingested, and an answer should be sent back
        */		
        if (this.peerConnection === null) {
            this.createPeerConnection();
        }
        
        const readyForOffer = !this.makingOffer && (this.peerConnection.signalingState === 'stable' || this.isSettingRemoteAnswerPending);
        const offerCollision = !readyForOffer;
        
        var ignoreOffer = !this.polite && offerCollision;
        if (ignoreOffer) {
            console.log('Potential collision found. Ignoring offer to avoid collision.')
            return;
        }
        
        this.target = messageObj.sender;
        this.peerConnection.setRemoteDescription({type: 'offer', sdp: messageObj.content.sdp})
            .then(() => {
                return this.peerConnection.createAnswer();
            })
            .then((answer) => {
                return this.peerConnection.setLocalDescription(answer);
            })
            .then(() => {
                // In the following line, the target becomes the sender and sender becomes target
                this.onMessageSendingAnswer(messageObj.sender, this.peerConnection.localDescription.sdp);
            })
            .catch(error => {
                console.log(error)}
            );
    }
            
    onMessageReceivedAnswer(messageObj) {
        if(!this) {
            console.log('Cannot access connection');
            return;
        }
        /*
        An answer was received from another client through the Signaling client
        It should be ingested and passed to our existing RTCPeerConnection
        */
        this.isSettingRemoteAnswerPending = true
        this.peerConnection.setRemoteDescription({type: 'answer', sdp: messageObj.content.sdp})
            .then(() => {
                this.isSettingRemoteAnswerPending = false;
            })
            .catch(error => {
                console.log(error);
            });
    }
        
    onMessageReceivedIce(messageObj) {
        /* 
        A new ICE candidate is received through the signaling client from another client,
        We need to add it to our RTCPeerConnection remote sdp
        */
        console.log('[WEBRTC] New ICE Candidate received: ', messageObj);
        
        var candidate = new RTCIceCandidate(
            {
                candidate: messageObj.content.sdpCandidate,
                sdpMLineIndex: messageObj.content.sdpMLineIndex,
                sdpMid: messageObj.content.sdpMid
        });
                    
        this.peerConnection.addIceCandidate(candidate)
            .catch(error => {
                console.log(error)
            });
    }
                
    /*
    Signaling WebRTC Messages Specifics, Sending
    */
    onMessageSending(args) {
        console.log("[WEBRTC] Message sending", args);
    }
        
    onMessageSendingOffer(target, sdp) {
        var msg = {
            metadata: {
                apiVersion: '1.0.1',
                compVersion: '1.0.1',
                compOrigin: 'WebRTC',
                projectName: 'TDWebRTCWebDemo',
            },
            signalingType: "Offer",
            sender: null, // will be filled by server
            target: target,
            content: {
                sdp: sdp // peerConnection.localDescription
            }
        };
        
        console.log('[WEBRTC] Sending offer', msg);

        // Use the signaling client websocket to send the ICE message
        this.signalingClient.webSocket.send(JSON.stringify(msg));

        // Offer has been made
        this.makingOffer = false
    }
            
    onMessageSendingAnswer(target, sdp) {
        var msg = {
            metadata: {
                apiVersion: '1.0.1',
                compVersion: '1.0.1',
                compOrigin: 'WebRTC',
                projectName: 'TDWebRTCWebDemo',
            },
            signalingType: "Answer",
            sender: null, // will be filled by server
            target: target,
            content: {
                sdp: sdp // peerConnection.localDescription
            }
        };
        
        console.log('[WEBRTC] Sending answer', msg);

        // Use the signaling client websocket to send the ICE message
        this.signalingClient.webSocket.send(JSON.stringify(msg));
    }
            
    onMessageSendingIce(target, sdpCandidate, sdpMLineIndex, sdpMid) {
        let msg = {
            metadata: {
                apiVersion: '1.0.1',
                compVersion: '1.0.1',
                compOrigin: 'WebRTC',
                projectName: 'TDWebRTCWebDemo',
            },
            signalingType: "Ice",
            sender: null, // will be filled by server
            target: target,
            content: {
                sdpCandidate: sdpCandidate, // peerConnection.localDescription
                sdpMLineIndex: sdpMLineIndex, 
                sdpMid: sdpMid
            }
        };
        
        console.log('[WEBRTC] Sending ICE', msg);

        // Use the signaling client websocket to send the ICE message
        this.signalingClient.webSocket.send(JSON.stringify(msg));
    }
                
    /* 
    RTCDataChannels Specifics
    */
    onDataReceived(event) {
        console.log("[WEBRTC] RTCDAtaChannels event",event);
    }
}
            
export default WebRTCConnection;