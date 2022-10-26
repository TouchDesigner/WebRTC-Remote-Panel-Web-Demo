import React, { Component } from 'react';
import Container from '@mui/material/Container';

class WebRTC extends Component {
	/*
	A React Component displaying the incoming WebRTC feed and sending out mouse input as data channel
	*/
	constructor(props) {
		super(props);

        // TODO: Document what each props are used for
		this.sendMouseData = this.sendMouseData.bind(this);
		this.sendKeyboardData = this.sendKeyboardData.bind(this);
		this.dcMouse = null;
		this.dcKeyboard = null;
		this.peerConnection = null;
		
		this.signalingClient = null;
		this.target = null;
		this.signalingClientMessagesTypes = ['Offer', 'Answer', 'Ice'];
		
		this.mediaConstraints = {
			audio: true,
			video: true,
		};

		// Perfect negotiation specific
		this.polite = false;
		this.makingOffer = false;
		this.ignoreOffer = false;
		this.isSettingRemoteAnswerPending = false;
	}

	componentDidMount() {
		console.log('WebRTC Component Mounted.')
	}

	createPeerConnection() {
		this.peerConnection = new RTCPeerConnection({
			iceServers: [
				{
					urls: "stun:stun.l.google.com:19302"
				}
			]
		});

		this.peerConnection.onconnectionstatechange = this.handleConnectionStateChange;
		this.peerConnection.ondatachannel = this.handleDataChannel;
		this.peerConnection.onicecandidate = this.handleIceCandidate.bind(this);
		this.peerConnection.onicecandidateerror = this.handleIceCandidateError;
		this.peerConnection.oniceconnectionstatechange = this.handleIceConnectionStateChange.bind(this);
		this.peerConnection.onicegatheringstatechange = this.handleIceGatheringStateChange;
		this.peerConnection.onnegotiationneeded = this.handleNegotiationNeeded.bind(this);
		this.peerConnection.onsignalingstatechange = this.handleSignalingStateChange;
		this.peerConnection.ontrack = this.handleTrack;
		this.peerConnection.removeTrack = this.handleRemoveTrack;

		// Initialize remoteStream on remoteVideo HTML element
		var remoteStream = new MediaStream();
		var remoteVideo = document.getElementById("remoteVideo");
		remoteVideo.srcObject = remoteStream;

		this.dcMouse = this.peerConnection.createDataChannel('MouseData');
		this.dcMouse.onopen = this.handleSendChannelStatusChange;
		this.dcMouse.onclose = this.handleSendChannelStatusChange;
		
		this.dcKeyboard = this.peerConnection.createDataChannel('KeyboardData');
		this.dcKeyboard.onopen = this.handleSendChannelStatusChange;
		this.dcKeyboard.onclose = this.handleSendChannelStatusChange;
	}

	deletePeerConnection() {
		var remoteVideo = document.getElementById("remoteVideo");

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
		

			this.dcMouse.close();
			this.dcKeyboard.close();
			this.dcMouse = null;
			this.dcKeyboard = null;

			this.peerConnection.close();
			this.peerConnection = null;
		}

		remoteVideo.removeAttribute("src");
		remoteVideo.removeAttribute("srcObject");
	}

	onCallStart(clientToCall) {
		console.log('onCallStart begins');

		var webRTCConnection = this;
		this.target = clientToCall.address;
		this.polite = this.signalingClient.client.properties.timeJoined < clientToCall.properties.timeJoined

		webRTCConnection.createPeerConnection()
				
		webRTCConnection.peerConnection.addTransceiver('video', {direction:'recvonly'});

		console.log('onCallStart ends');
	}

	onCallEnd(clientOnCall) {
		this.deletePeerConnection();
	}

	/*
	RTCPeerConnection event handlers
	*/
	handleConnectionStateChange(event) {
		console.log('Connection State Change: ', event);
	}

	handleDataChannel = (rtcDataChannelEvent) => {
		console.log('RTCDataChannel Event: ', rtcDataChannelEvent);
	}
	
	handleIceCandidate(event) {
		// Get connection if unavailable, so that target can be filled, hacked in at the moment
		console.log('New ICE Candidate: ', event);
		if (event.candidate) { 
            // TODO: debug why in some cases, no candidates are sent out but event triggers
			var target = this.signalingClient.state.tdClients[0].address;
			
			this.onMessageSendingIce(
				target,
				event.candidate.candidate,
				event.candidate.sdpMLineIndex,
				event.candidate.sdpMid
			);
		}
	}

	handleIceCandidateError(event) {
		console.log('ICE Candidate Error: ', event)
	}

	handleIceConnectionStateChange(event) {
		// console.log(event);
		switch (this.peerConnection.iceConnectionState) {
			case "default":
				break;
			case "closed":
				break;
			case "failed":
				// this.deletePeerConnection();
				this.peerConnection.restartIce();
				break;
			default:
				console.log("No matching iceConnectionState" + event);
		}
	}

	handleIceGatheringStateChange(event) {
		console.log('Gathering state changed to ', event);
	}

	handleNegotiationNeeded(event) {
		console.log('Negotiation needed: ', event);
		
		var webRTCConnection = this;

		if (webRTCConnection.peerConnection.signalingState === 'have-remote-offer') {
			console.log('Already have a remote offer, exiting.')
			return;
		}

		if (webRTCConnection.makingOffer) {
			console.log('Already making an offer, exiting.')
			return;
		}

		try {
			webRTCConnection.makingOffer = true;
			webRTCConnection.peerConnection.setLocalDescription()
			.then(function () {
				webRTCConnection.onMessageSendingOffer(
					webRTCConnection.target,
					webRTCConnection.peerConnection.localDescription.sdp
				);
			})
		} catch (err) {
			console.error(err);
		} finally {
			this.makingOffer = false;
		}
	}

	handleSignalingStateChange(event) {
		console.log('Signaling State Change: ', event, event.currentTarget.signalingState);
	}

	handleTrack(event) {
		console.log('New Track Event: ', event);
		document.getElementById("remoteVideo").srcObject.addTrack(event.track);
	}

	handleRemoveTrack(event) {
		console.log('Remove track event: ', event);
		var remoteStream = document.getElementById("remoteVideo").srcObject;
		var trackList = remoteStream.getTracks();

		if (trackList.length === 0) {
			this.deletePeerConnection();
		}
	}

	/*
		Signaling WebRTC Messages Specifics, Received
	*/
	onMessageReceived = (messageObj) => {
		var fnName = 'onMessageReceived' + messageObj.signalingType;
		var fnToCall = this[fnName];

		if (fnToCall === undefined) {
			console.log('The function ' + fnName + ' is not implemented in WebRTC.')
		} else {
			fnToCall(messageObj);
		}
	}

	onMessageReceivedOffer = (messageObj) => {
		/*
		An offer was received from another client through the Signaling client
		It should be ingested, and an answer should be sent back
		*/		
		var webRTCConnection = this;
		
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
		.then(function () {
			return webRTCConnection.peerConnection.createAnswer();
		})
		.then(function (answer) {
			return webRTCConnection.peerConnection.setLocalDescription(answer);
		})
		.then( function() {
			// In the following line, the target becomes the sender and sender becomes target
			webRTCConnection.onMessageSendingAnswer(messageObj.sender, webRTCConnection.peerConnection.localDescription.sdp);
		})
		.catch(error => {console.log(error)});
	}
	
	onMessageReceivedAnswer = (messageObj) => {
		/*
		An answer was received from another client through the Signaling client
		It should be ingested and passed to our existing RTCPeerConnection
		*/
		this.isSettingRemoteAnswerPending = true
		this.peerConnection.setRemoteDescription({type: 'answer', sdp: messageObj.content.sdp}).then( function () {
			this.isSettingRemoteAnswerPending = false;
		})
		.catch(error => {console.log(error)});
	}

	onMessageReceivedIce = (messageObj) => {
		/* 
		A new ICE candidate is received through the signaling client from another client,
		We need to add it to our RTCPeerConnection remote sdp
		*/
		console.log('New ICE Candidate received: ', messageObj);

		var candidate = new RTCIceCandidate(
			{
				candidate: messageObj.content.sdpCandidate,
				sdpMLineIndex: messageObj.content.sdpMLineIndex,
				sdpMid: messageObj.content.sdpMid
			});
		
		console.log(candidate)
		
		this.peerConnection.addIceCandidate(candidate)
		.catch(error => {
			console.log(error)
		});
	}

	/*
		Signaling WebRTC Messages Specifics, Sending
	*/
	onMessageSending = (args) => {
		console.log(args);
	}

	onMessageSendingOffer = (target, sdp) => {
		var msg = {
			metadata: {
				apiVersion: '1.0.1',
				compVersion: '1.0.1',
				compOrigin: 'WebRTC',
				projectName: 'TDWebRTCWebDemo',
			},
			signalingType: "Offer",
			sender: null, // will be filled by server
			target: target, // TODO: to fill, if None, server will broadcast on domain
			content: {
				sdp: sdp // this.peerConnection.localDescription
			}
		};
		
		console.log('Sending offer', msg);
		this.signalingClient.ws.send(JSON.stringify(msg));
		this.makingOffer = false
	}

	onMessageSendingAnswer= (target, sdp) => {
		var msg = {
			metadata: {
				apiVersion: '1.0.1',
				compVersion: '1.0.1',
				compOrigin: 'WebRTC',
				projectName: 'TDWebRTCWebDemo',
			},
			signalingType: "Answer",
			sender: null, // will be filled by server
			target: target, // TODO: to fill, if None, server will broadcast on domain
			content: {
				sdp: sdp // this.peerConnection.localDescription
			}
		};
		
		console.log('Sending answer', msg);
		this.signalingClient.ws.send(JSON.stringify(msg));
	}

	onMessageSendingIce(target, sdpCandidate, sdpMLineIndex, sdpMid) {
		var msg = {
			metadata: {
				apiVersion: '1.0.1',
				compVersion: '1.0.1',
				compOrigin: 'WebRTC',
				projectName: 'TDWebRTCWebDemo',
			},
			signalingType: "Ice",
			sender: null, // will be filled by server
			target: target, // TODO: to fill, if None, server will broadcast on domain
			content: {
				sdpCandidate: sdpCandidate, // this.peerConnection.localDescription
				sdpMLineIndex: sdpMLineIndex, 
				sdpMid: sdpMid
			}
		};
		
		console.log('Sending ICE', msg);
		this.signalingClient.ws.send(JSON.stringify(msg));
	}

	/* 
	RTCDataChannels Specifics
	*/
	onDataReceived(event) {
		console.log(event);

	}

	sendKeyboardData(event) {		
		if (!this.dcKeyboard) {
			console.log('The dataChannel does not exist, aborting.')
			return
		}

		let keyboardEventDict = {
			type: event.type,
			key: event.key,
			code: event.code,
			location: event.location,
			repeat: event.repeat,
			isComposing: event.isComposing,
			ctrlKey: event.ctrlKey,
			shiftKey: event.shiftKey,
			altKey: event.altKey,
			metaKey: event.metaKey
		}
		
		this.sendData(JSON.stringify(keyboardEventDict), this.dcKeyboard)

	}

	sendMouseData(event) {
		// Get video container size
		if (!this.dcMouse) {
			console.log('The dataChannel does not exist, aborting.')
			return
		}

		var msCont = document.getElementById('remoteVideo')
		var comStyle = window.getComputedStyle(msCont, null);
		var width = parseInt(comStyle.getPropertyValue("width"), 10);
		var height = parseInt(comStyle.getPropertyValue("height"), 10);
		
		let mouseEventDict = {
			lselect: event.buttons === 1 ? true : false,
			mselect: event.buttons === 4 ? true : false,
			rselect: event.buttons === 2 ? true : false,
			insideu: 1-(event.nativeEvent.offsetX/width),
			insidev: 1-(event.nativeEvent.offsetY/height)
		}
	
		this.sendData(JSON.stringify(mouseEventDict), this.dcMouse)
	}

	sendData(data, dataChannel) {
		if (dataChannel.readyState === 'open') {
			dataChannel.send(data)
		}
	}

	render() {
        return <Container id="webRTCViewer" style={{backgroundColor: 'lightGrey'}} disableGutters>
            <video 
                id="remoteVideo"
                width="100%"
                height="100%"
                style={{transform: 'scaleX(-1)'}}
 				autoPlay
		        muted={ false }
                controls={ false }
                onMouseDown={ this.sendMouseData }
                onMouseMove={ this.sendMouseData }
            >
            </video>
        </Container>;
	}
}

export default WebRTC;