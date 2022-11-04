import React, { useState } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { List } from '@mui/material';

// Local
import WebSocketClientListItem from './WebSocketClientListItem';


/**
 * React Component displaying the Signaling connection form and all connected clients
 * @param {*} props 
 * @returns 
 */
function SignalingPanel(props) {

	const componentStyle = {
		backgroundColor: "darkgray",
		width: "20%"
	}

	const [tdClients, setTDClients] = useState([]);
	const [port, setPort] = useState(9980);
	const [address, setAddress] = useState('127.0.0.1');


	let client = {
		id: null,
		address: null,
		properties: {domain: '/'}
	}
	let webRTCConnection = null;

	const handleAddressChange = (event) => {
		console.log('Signaling Host Address was changed');
		setAddress(event.target.value);
	}

	const handlePortChange = (event) => {
		console.log('Signaling Host Port was changed');
		setPort(event.target.value);
	}

	const handleClickConnect = (event) => {
		// TODO: Check if already a WS instance
		if (ws && ws.OPEN) {
			var protocol = (window.location.protocol === 'https:') ? 'wss://' : 'ws://';
			ws = new W3CWebSocket(protocol + address + ':' + port);
		}

		// TODO: Set button to connected state
		console.log('Signaling Host was changed (or connected) to: ' + ws);
	} 

	// Should this live in the signaling panel??
	const onMessageReceived = (messageObj) => {
		console.log('Signaling, message received:', messageObj);
		var fnName = 'onMessageReceived' + messageObj.signalingType;
		var fnToCall = this[fnName];

		if (fnToCall === undefined) {
			/* 
			If the fnToCall doesn't exist in the current object (signaling client)
			We attempt to call it on a subscriber 
			(at the moment, there is only one subscriber and we are hardcoding it, the webRTCConnection)
			*/
			// TODO: Check if thats causing the nego issues here
			if (webRTCConnection.signalingClientMessagesTypes.indexOf(messageObj.signalingType) > -1) {
				// message should be forwarded
				webRTCConnection.onMessageReceived(messageObj);
			} else {
				console.log('No match was found in the WebRTC Messages Signaling Types.')
			}
		} else {
			fnToCall(messageObj);
		}
	}

	/*
	*	Signaling Messages Specifics
	*/
	// const onMessageReceivedClientEntered = (messageObj) => {
	// 	client.id = messageObj.content.self.id
	// 	client.address = messageObj.content.self.address
	// 	client.properties = messageObj.content.self.properties 
	// }

	// const onMessageReceivedClientEnter = (messageObj) => {
	// 	var exists = false

	// 	setTDClients(tdClients.some(function (tdClient) {
	// 		if (tdClient.id === messageObj.content.client.id) {
	// 			exists = true;
	// 			return true;
	// 		} else {
	// 			return false;
	// 		}
	// 	}));

	// 	if (exists === true) {
	// 		console.log('tdClient ' + messageObj.content.client.id + ' is already known.');
	// 	} else {
	// 		var newTDClient = WebSocketClientListItem({ 
	// 			id: messageObj.content.client.id, 
	// 			address: messageObj.content.client.address, 
	// 			properties: messageObj.content.client.properties, 
	// 			signalingClient: this 
	// 		});

	// 		var tdClientsWorkerArray = [...tdClients];
	// 		tdClientsWorkerArray.push(newTDClient);
	// 		setTDClients(tdClientsWorkerArray);
	// 		console.log('The client with id ' + newTDClient.id + ' joined the session.');
	// 	}
	// }

	// const onMessageReceivedClientExit = (messageObj) => {
	// 	var tdClientsWorkerArray = [...tdClients];
	// 	for (var i = tdClientsWorkerArray.length - 1; i >= 0; --i) {
	// 		if (tdClientsWorkerArray[i].id === messageObj.content.id) {
	// 			tdClientsWorkerArray.splice(i, 1);
	// 		}
	// 	}

	// 	setTDClients(tdClientsWorkerArray);
	// 	console.log('The client with id ' + messageObj.content.id + ' left the session.');
	// }

	// const onMessageReceivedClients = (messageObj) => {
	// 	var signalingClient = this;
	// 	var tdClientsWorkerArray = []

	// 	messageObj.content.clients.some(function (client) {
	// 		var clientAsDict = client;
	// 		// TODO: Make sure self is not added to this list
	// 		// This method should be called in the Map, we should be storing an object
	// 		var newTDClient = WebSocketClientListItem({ id: clientAsDict.id, address: clientAsDict.address, properties: clientAsDict.properties, signalingClient: signalingClient });
	// 		tdClientsWorkerArray = [...signalingClient.tdClients];
	// 		tdClientsWorkerArray.push(newTDClient);

	// 		return tdClientsWorkerArray;
	// 	});
		
	// 	setTDClients(tdClientsWorkerArray);
	// }

	// Instantiate Websocket and bing its handlers
	let ws = new W3CWebSocket('ws://' + address + ':' + port);
	// following code updates the state
	// your component will call the render method
	// so that your changes can be seen in your dom
	ws.onopen = () => {
		console.log('WebSocket Client Connected');
	};
	ws.onmessage = (message) => {
		var messageObj = JSON.parse(message.data);
		onMessageReceived(messageObj);
	};
	ws.onclose = () => {
		console.log('WebSocket Client Closed');
	}
	ws.onerror = (error) => {
		console.log(error);
	}
	console.log(ws);

	return <Container id="tdSignaling" style={ componentStyle }>
		<h2>Signaling: </h2>
		<Container id="tdSignalingForm" disableGutters></Container>
		<h3>Signaling server settings: </h3>
		<TextField variant='standard' label='Address' id='adress' defaultValue='127.0.0.1' onChange={ handleAddressChange }></TextField>
		<TextField variant='standard' label='Port' id='port' defaultValue='9980' onChange={ handlePortChange }></TextField>
		<Button variant='contained' id='btnConnect' style={{ marginTop: 2 }} onClick={ handleClickConnect }>Connect</Button>
		<Container id="tdSignalingList" disableGutters>
			<h3>Signaling clients List: </h3>
			<List className='clients'>
				{
					// Shady, should use react component instead of object instance
					tdClients.map(tdClient => tdClient)
				}
			</List>
		</Container>
	</Container>;
}

export default SignalingPanel;