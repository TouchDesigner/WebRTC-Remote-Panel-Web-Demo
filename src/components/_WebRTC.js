import React from 'react';
import Container from '@mui/material/Container';

/*
A React Component displaying the incoming WebRTC feed and sending out mouse input as data channel

Currently handles all WebRTC comm logics

1. Remote media stream as video
2. Data stream as mouse input (MouseData)
3. Data stream as keyboard input (KeyboardData)
*/
function WebRTC(props) {
	// let dcMouse = null;
	// let dcKeyboard = null;
	// let peerConnection = null;
	
	// let signalingClient = null;
	// let target = null;
	// let signalingClientMessagesTypes = ['Offer', 'Answer', 'Ice'];
	
	// let mediaConstraints = {
	// 	audio: true,
	// 	video: true,
	// };

	// // Perfect negotiation specific
	// let polite = false;
	// let makingOffer = false;
	// let ignoreOffer = false;
	// let isSettingRemoteAnswerPending = false;

	const createPeerConnection = (peerConnection) => {
		peerConnection = new RTCPeerConnection({
			iceServers: [
				{
					urls: "stun:stun.l.google.com:19302"
				}
			]
		});

		peerConnection.onconnectionstatechange = handleConnectionStateChange;
		peerConnection.ondatachannel = handleDataChannel;
		peerConnection.onicecandidate = handleIceCandidate
		peerConnection.onicecandidateerror = handleIceCandidateError;
		peerConnection.oniceconnectionstatechange = handleIceConnectionStateChange
		peerConnection.onicegatheringstatechange = handleIceGatheringStateChange;
		peerConnection.onnegotiationneeded = handleNegotiationNeeded
		peerConnection.onsignalingstatechange = handleSignalingStateChange;
		peerConnection.ontrack = handleTrack;
		peerConnection.removeTrack = handleRemoveTrack;

		// Initialize remoteStream on remoteVideo HTML element
		var remoteStream = new MediaStream();
		var remoteVideo = document.getElementById("remoteVideo");
		remoteVideo.srcObject = remoteStream;

		dcMouse = peerConnection.createDataChannel('MouseData');
		dcMouse.onopen = handleSendChannelStatusChange;
		dcMouse.onclose = handleSendChannelStatusChange;
		
		dcKeyboard = peerConnection.createDataChannel('KeyboardData');
		dcKeyboard.onopen = handleSendChannelStatusChange;
		dcKeyboard.onclose = handleSendChannelStatusChange;
	}

	const deletePeerConnection = () => {
		var remoteVideo = document.getElementById("remoteVideo");

		if (peerConnection) {
			peerConnection.onconnectionstatechange = null;
			peerConnection.ondatachannel = null;
			peerConnection.onicecandidate = null;
			peerConnection.onicecandidateerror = null;
			peerConnection.oniceconnectionstatechange = null;
			peerConnection.onicegatheringstatechange = null;
			peerConnection.onnegotiationneeded = null;
			peerConnection.onsignalingstatechange = null;
			peerConnection.ontrack = null;
			peerConnection.removeTrack = null;

			if (remoteVideo.srcObject) {
				remoteVideo.srcObject.getTracks().forEach(track => track.stop());
			}
		

			dcMouse.close();
			dcKeyboard.close();
			dcMouse = null;
			dcKeyboard = null;

			peerConnection.close();
			peerConnection = null;
		}

		remoteVideo.removeAttribute("src");
		remoteVideo.removeAttribute("srcObject");
	}

	const onCallStart = (address, properties) => {
		console.log('onCallStart begins');

		var webRTCConnection = this;
		target = address;
		polite = signalingClient.client.properties.timeJoined < properties.timeJoined

		webRTCConnection.createPeerConnection()
				
		webRTCConnection.peerConnection.addTransceiver('video', {direction:'recvonly'});

		console.log('onCallStart ends');
	}

	const onCallEnd = () => {
		deletePeerConnection();
	}

	/*
	RTCPeerConnection event handlers
	*/
	const handleConnectionStateChange = (event) => {
		console.log('Connection State Change: ', event);
	}

	const handleDataChannel = (rtcDataChannelEvent) => {
		console.log('RTCDataChannel Event: ', rtcDataChannelEvent);
	}
	
	const handleIceCandidate = (event) => {
		// Get connection if unavailable, so that target can be filled, hacked in at the moment
		console.log('New ICE Candidate: ', event);
		if (event.candidate) { 
            // TODO: debug why in some cases, no candidates are sent out but event triggers
			let target = signalingClient.state.tdClients[0].address;
			
			onMessageSendingIce(
				target,
				event.candidate.candidate,
				event.candidate.sdpMLineIndex,
				event.candidate.sdpMid
			);
		}
	}

	const handleIceCandidateError = (event) => {
		console.log('ICE Candidate Error: ', event)
	}

	const handleIceConnectionStateChange = (event) => {
		// console.log(event);
		switch (peerConnection.iceConnectionState) {
			case "default":
				break;
			case "closed":
				break;
			case "failed":
				// deletePeerConnection();
				peerConnection.restartIce();
				break;
			default:
				console.log("No matching iceConnectionState" + event);
		}
	}

	const handleIceGatheringStateChange = (event) => {
		console.log('Gathering state changed to ', event);
	}

	const handleNegotiationNeeded = (event) => {
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
			makingOffer = false;
		}
	}

	const handleSignalingStateChange = (event) => {
		console.log('Signaling State Change: ', event, event.currentTarget.signalingState);
	}

	const handleTrack = (event) => {
		console.log('New Track Event: ', event);
		document.getElementById("remoteVideo").srcObject.addTrack(event.track);
	}

	const handleRemoveTrack = (event) => {
		console.log('Remove track event: ', event);
		var remoteStream = document.getElementById("remoteVideo").srcObject;
		var trackList = remoteStream.getTracks();

		if (trackList.length === 0) {
			deletePeerConnection();
		}
	}

	/*
		Signaling WebRTC Messages Specifics, Received
	*/
	const onMessageReceived = (messageObj) => {
		var fnName = 'onMessageReceived' + messageObj.signalingType;
		var fnToCall = this[fnName];

		if (fnToCall === undefined) {
			console.log('The function ' + fnName + ' is not implemented in WebRTC.')
		} else {
			fnToCall(messageObj);
		}
	}

	const onMessageReceivedOffer = (messageObj) => {
		/*
		An offer was received from another client through the Signaling client
		It should be ingested, and an answer should be sent back
		*/		
		var webRTCConnection = this;
		
		if (peerConnection === null) {
			createPeerConnection();
		}
			
		const readyForOffer = !makingOffer && (peerConnection.signalingState === 'stable' || isSettingRemoteAnswerPending);
		const offerCollision = !readyForOffer;
	
		var ignoreOffer = !polite && offerCollision;
		if (ignoreOffer) {
			console.log('Potential collision found. Ignoring offer to avoid collision.')
			return;
		}

		target = messageObj.sender;
		peerConnection.setRemoteDescription({type: 'offer', sdp: messageObj.content.sdp})
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
	
	const onMessageReceivedAnswer = (messageObj) => {
		/*
		An answer was received from another client through the Signaling client
		It should be ingested and passed to our existing RTCPeerConnection
		*/
		isSettingRemoteAnswerPending = true
		peerConnection.setRemoteDescription({type: 'answer', sdp: messageObj.content.sdp}).then( function () {
			isSettingRemoteAnswerPending = false;
		})
		.catch(error => {console.log(error)});
	}

	const onMessageReceivedIce = (messageObj) => {
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
		
		peerConnection.addIceCandidate(candidate)
		.catch(error => {
			console.log(error)
		});
	}

	/*
		Signaling WebRTC Messages Specifics, Sending
	*/
	const onMessageSending = (args) => {
		console.log(args);
	}

	const onMessageSendingOffer = (target, sdp) => {
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
				sdp: sdp // peerConnection.localDescription
			}
		};
		
		console.log('Sending offer', msg);
		signalingClient.ws.send(JSON.stringify(msg));
		makingOffer = false
	}

	const onMessageSendingAnswer= (target, sdp) => {
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
				sdp: sdp // peerConnection.localDescription
			}
		};
		
		console.log('Sending answer', msg);
		signalingClient.ws.send(JSON.stringify(msg));
	}

	const onMessageSendingIce = (target, sdpCandidate, sdpMLineIndex, sdpMid) => {
		let msg = {
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
				sdpCandidate: sdpCandidate, // peerConnection.localDescription
				sdpMLineIndex: sdpMLineIndex, 
				sdpMid: sdpMid
			}
		};
		
		console.log('Sending ICE', msg);
		signalingClient.ws.send(JSON.stringify(msg));
	}

	/* 
	RTCDataChannels Specifics
	*/
	const onDataReceived(event) {
		console.log(event);
	}

	const sendKeyboardData(event) {		
		if (!dcKeyboard) {
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
		
		sendData(JSON.stringify(keyboardEventDict), dcKeyboard)

	}

	const sendMouseData = (event) => {
		// Get video container size
		if (!dcMouse) {
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
	
		sendData(JSON.stringify(mouseEventDict), dcMouse)
	}

	const sendData = (data, dataChannel) => {
		if (dataChannel.readyState === 'open') {
			dataChannel.send(data)
		}
	}

	// return <Container id="webRTCViewer" style={{backgroundColor: 'lightGrey'}} disableGutters>
	// 	<video 
	// 		id="remoteVideo"
	// 		width="100%"
	// 		height="100%"
	// 		style={{transform: 'scaleX(-1)'}}
	// 		autoPlay
	// 		muted={ false }
	// 		controls={ false }
	// 		onMouseDown={ sendMouseData }
	// 		onMouseMove={ sendMouseData }
	// 	>
	// 	</video>
	// </Container>; 
}

export default WebRTC;