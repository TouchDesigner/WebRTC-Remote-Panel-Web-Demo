import React, { useState, useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';

import { w3cwebsocket as W3CWebSocket } from "websocket";
// Import the webrtc shim to ensure maintaining features despite browser implementation changes
// It's important to keep this line but it's not used in the code.
// eslint-disable-next-line  no-unused-vars
import adapter from 'webrtc-adapter';

// Import local components
import SignalingClientPanel from './components/SignalingClientPanel';
import MediaPanel from './components/MediaPanel';



function App() {
	// App state management à la React
	const [port, setPort] = useState(9980);
	const [address, setAddress] = useState('127.0.0.1');
	const [webSocketClients, setWebSocketClients] = useState([]);
	const [connectedToServer, setConnectedToServer] = useState(false);

	/*******************************************************************************************************
	 * SIGNALING SETUP
	 * Allows to communicate with the TD Server to list clients that may stream on webrtc
	*/

	/**
	 * Update the websocket clients list to the one provided by the server
	 * 
	 * API Description:
	 * A signaling message sent from the signaling server to a client 
	 * to make it aware of other signaling clients within the signaling session
	 * The signaling message type property should be set to Clients, and a list of clients 
	 * should be set in the clients property of the content dictionary.
	 * @param {*} message.clients
	 */
	const onClientsMessage = (message) => {
		// let wsClientsTempArray = [];
		let { clients } = message.content;
		console.log(clients.length + ' listed clients');
		// clients.some(function (client) {
		// 	let { id, address, properties } = client;

		// 	// TODO: Make sure self is not added to this list
		// 	// This method should be called in the Map, we should be storing an object
		// 	let newWSClient = { id, address, properties };
		// 	wsClientsTempArray = [...webSocketClients];
		// 	wsClientsTempArray.push(newWSClient);

		// 	return wsClientsTempArray;
		// });
		
		// Set React state
		setWebSocketClients(clients);
	}

	/**
	 * 
	 * 
	 * API Description:
	 * A signaling message sent from the signaling server to clients in the signaling session 
	 * to make them aware that a client entered the signaling session.
	 * The signaling message type property should be set to ClientEnter, and a Client dictionary 
	 * should be set in the client property of the content dictionary.
	 * 
	 * @param {*} message 
	 */
	const onClientEnter = (message) => {
		// var exists = false

		// setTDClients(tdClients.some(function (tdClient) {
		// 	if (tdClient.id === messageObj.content.client.id) {
		// 		exists = true;
		// 		return true;
		// 	} else {
		// 		return false;
		// 	}
		// }));

		// if (exists === true) {
		// 	console.log('tdClient ' + messageObj.content.client.id + ' is already known.');
		// } else {
		// 	var newTDClient = WebSocketClientListItem({ 
		// 		id: messageObj.content.client.id, 
		// 		address: messageObj.content.client.address, 
		// 		properties: messageObj.content.client.properties, 
		// 		signalingClient: this 
		// 	});

		// 	var tdClientsWorkerArray = [...tdClients];
		// 	tdClientsWorkerArray.push(newTDClient);
		// 	setTDClients(tdClientsWorkerArray);
		// 	console.log('The client with id ' + newTDClient.id + ' joined the session.');
		// }
	}

	/**
	 * Confirmation from the server that we are connected to its signaling session
	 * 
	 * API Description:
	 * A signaling message sent from the signaling server to a client to acknowledge that the client entered 
	 * the signaling session and was registered by the signaling server.
	 * The signaling message type property should be set to ClientEntered, and a Client dictionary should be 
	 * set in the self property of the content dictionary.
	 * 
	 * @param {*} message.content the client infos
	 */
	const onClientEntered = (message) => {
		// In the previous code it was setting it to a component object, which was never used
		// console.log('Client Enter', message.content);
		setConnectedToServer(true);
	}

	/**
	 * 
	 * API Description:
	 * A signaling message sent from the signaling server to clients in the signaling session to make
	 * them aware that a client left the signaling session
	 * The signaling message type property should be set to ClientExit, and a Client ID should be set 
	 * in the id property of the content dictionary.
	 * 
	 * @param {*} message.content the client infos
	 */
	const onClientExit = (messageObj) => {
		// var tdClientsWorkerArray = [...tdClients];
		// for (var i = tdClientsWorkerArray.length - 1; i >= 0; --i) {
		// 	if (tdClientsWorkerArray[i].id === messageObj.content.id) {
		// 		tdClientsWorkerArray.splice(i, 1);
		// 	}
		// }

		// setTDClients(tdClientsWorkerArray);
		// console.log('The client with id ' + messageObj.content.id + ' left the session.');
	}

	// Route websockets message to the right handler
	const onWebSocketMessageReceived = (messageObject) => {
		// Message follow the TD Signaling API JSON Schema syntax
		// See https://docs.derivative.ca/Palette:signalingServer#Signaling_API
		const {signalingType} = messageObject;

		switch(signalingType) {
			case 'Clients':
				// console.log('Received Clients message from TD');
				onClientsMessage(messageObject);
				break;
			case 'ClientEnter':
				// console.log('Received ClientEnter message from TD');
				onClientEnter(messageObject);
				break;
			case 'ClientEntered':
				// console.log('Received ClientEntered message from TD');
				onClientEntered(messageObject);
				break;
			case 'ClientExit':
				// console.log('Received ClientExit message from TD');
				onClientExit(messageObject);
				break;
		}
	}


	/************************************************************************
	 * WEBRTC SETUP
	 */
	let dcMouse = null;
	let dcKeyboard = null;
	let peerConnection = null;
	let signalingClient = null;
	let target = null;
	let signalingClientMessagesTypes = ['Offer', 'Answer', 'Ice'];
	let mediaConstraints = {
		audio: true,
		video: true,
	};
	// Perfect negotiation specific
	let polite = false;
	let makingOffer = false;
	let ignoreOffer = false;
	let isSettingRemoteAnswerPending = false;

	/************************************************************************
	 * React app rendering
	 */
	// We need to use the useEffect hook in order to not open a ws at every refresh
	useEffect(
		() => {
			// Instantiate Websocket and bing its handlers
			let ws = new W3CWebSocket('ws://' + address + ':' + port);
			// following code updates the state
			// your component will call the render method
			// so that your changes can be seen in your dom
			ws.onopen = () => {
				console.log('[WEBSOCKET] Client connected');
			};
			ws.onmessage = (message) => {
				var messageObj = JSON.parse(message.data);
				console.log('[WEBSOCKET] Message received: ', messageObj)
				onWebSocketMessageReceived(messageObj);
			};
			ws.onclose = () => {
				console.log('[WEBSOCKET] Client closed');
			}
			ws.onerror = (error) => {
				console.error('[WEBSOCKET] ERROR ', error);
			}
			
			// Disconnect when done
			return () => {
				// Close websocket
				ws.close();
			}
	  },
	[]);

	return <Container id='tdApp' maxWidth='x1'>
		<CssBaseline></CssBaseline>
		<h1>TD WebRTC Web Demo 🍌</h1>
		<Container maxWidth='x1' disableGutters style={{ display: 'inline-flex'}}>
			<SignalingClientPanel 
				address={address} 
				port={port} 
				clients={webSocketClients} 
				connectedToServer
			/>
		</Container>
	</Container>;
}

export default App;