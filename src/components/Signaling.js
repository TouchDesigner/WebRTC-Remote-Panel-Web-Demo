import React, { Component } from 'react';
import { w3cwebsocket as W3CWebSocket } from "websocket";
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { List } from '@mui/material';

// Local
import TDClient from './TDClient';

class Signaling extends Component {
	/*
	A React Component displaying the Signaling connection form and all connected clients
	*/
	constructor(props) {
		super(props);
		this.state = {
			tdClients: [],
			address: '127.0.0.1',
			port: 9980
		}
		this.client = {
			id: null,
			address: null,
			properties: {domain: '/'}
		}
		this.ws = null;
		this.webRTCConnection = null;

        // CSS Styling
        this.componetnStyle = {
            backgroundColor: "darkgray",
            width: "20%"
        }
	}

	componentDidMount(prevProps, prevState, snapshot) {
		console.log('Signaling Component mounted.', prevProps, prevState, snapshot);
		this.ws = new W3CWebSocket('ws://' + this.state.address + ':' + this.state.port);
		this.websocketBind();
	}

	websocketBind() {
		// following code updates the state
		// your component will call the render method
		// so that your changes can be seen in your dom
		this.ws.onopen = () => {
			console.log('WebSocket Client Connected');
		};
		this.ws.onmessage = (message) => {
			var messageObj = JSON.parse(message.data);
			this.onMessageReceived(messageObj);
		};
		this.ws.onclose = () => {
			console.log('WebSocket Client Closed');
		}
		this.ws.onerror = (error) => {
			console.log(error);
		}
		console.log(this.ws);
	}

	handleAddressChange = (event) => {
		console.log('Signaling Host Address was changed');
		this.setState({ address: event.target.value });
	}

	handlePortChange = (event) => {
		console.log('Signaling Host Port was changed');
		this.setState({ port: event.target.value });
	}

	handleClickConnect = () => {
		// TODO: Check if already a WS instance
		if (this.ws && this.ws.OPEN) {
			var protocol = (window.location.protocol === 'https:') ? 'wss://' : 'ws://';
			this.ws = new W3CWebSocket(protocol + this.state.address + ':' + this.state.port);
		}

		// TODO: Set button to connected state
		console.log('Signaling Host was changed (or connected) to: ' + this.ws);
	}

	onMessageReceived = (messageObj) => {
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
			if (this.webRTCConnection.signalingClientMessagesTypes.indexOf(messageObj.signalingType) > -1) {
				// message should be forwarded
				this.webRTCConnection.onMessageReceived(messageObj);
			} else {
				console.log('No match was found in the WebRTC Messages Signaling Types.')
			}
		} else {
			fnToCall(messageObj);
		}
	}

	/*
		Signaling Messages Specifics
	*/
	onMessageReceivedClientEntered = (messageObj) => {
		this.client.id = messageObj.content.self.id
		this.client.address = messageObj.content.self.address
		this.client.properties = messageObj.content.self.properties 
	}

	onMessageReceivedClientEnter = (messageObj) => {
		var exists = false

		this.state.tdClients.some(function (tdClient) {
			if (tdClient.id === messageObj.content.client.id) {
				exists = true;
				return true;
			} else {
				return false;
			}
		});

		if (exists === true) {
			console.log('tdClient ' + messageObj.content.client.id + ' is already known.');
		} else {
			var newTDClient = new TDClient({ 
				id: messageObj.content.client.id, 
				address: messageObj.content.client.address, 
				properties: messageObj.content.client.properties, 
				parent: this 
			})

			var tdClientsWorkerArray = [...this.state.tdClients];
			tdClientsWorkerArray.push(newTDClient);
			this.setState({ tdClients: tdClientsWorkerArray });
			console.log('The client with id ' + newTDClient.id + ' joined the session.');
		}
	}

	onMessageReceivedClientExit = (messageObj) => {
		var tdClientsWorkerArray = [...this.state.tdClients];
		for (var i = tdClientsWorkerArray.length - 1; i >= 0; --i) {
			if (tdClientsWorkerArray[i].id === messageObj.content.id) {
				tdClientsWorkerArray.splice(i, 1);
			}
		}

		this.setState({ tdClients: tdClientsWorkerArray });
		console.log('The client with id ' + messageObj.content.id + ' left the session.');
	}

	onMessageReceivedClients = (messageObj) => {
		var signalingClient = this;
		var tdClientsWorkerArray = []

		messageObj.content.clients.some(function (client) {
			var clientAsDict = client;
			// TODO: Make sure self is not added to this list
			var newTDClient = new TDClient({ id: clientAsDict.id, address: clientAsDict.address, properties: clientAsDict.properties, parent: signalingClient });
			tdClientsWorkerArray = [...signalingClient.state.tdClients];
			tdClientsWorkerArray.push(newTDClient);

			return tdClientsWorkerArray;
		});

		this.setState({ tdClients: tdClientsWorkerArray });
	}

	render() {
        return <Container id="tdSignaling" style={ this.componentStyle }>
            <h2>Signaling: </h2>
            <Container id="tdSignalingForm" disableGutters></Container>
            <h3>Signaling server settings: </h3>
            <TextField variant='standard' label='Address' id='adress' defaultValue='127.0.0.1' onChange={ this.handleAddressChange }></TextField>
            <TextField variant='standard' label='Port' id='port' defaultValue='9980' onChange={ this.handlePortChange }></TextField>
            <Button variant='contained' id='btnConnect' style={{ marginTop: 2 }} onClick={ this.handleClickConnect }>Connect</Button>
            <Container id="tdSignalingList" disableGutters>
                <h3>Signaling clients List: </h3>
                <List className='clients'>
                    {
                        // Shady, should use react component instead of object instance
                        this.state.tdClients.map(tdClient => tdClient.render())
                    }
                </List>
            </Container>
        </Container>;
	}
}

export default Signaling;