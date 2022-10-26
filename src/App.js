import React, { Component } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';

// Import the webrtc shim to ensure maintaining features despite browser implementation changes
// It's important to keep this line but it's not used in the code.
// eslint-disable-next-line  no-unused-vars
import adapter from 'webrtc-adapter';

// Import local components
import Signaling from './components/Signaling';
import WebRTC from './components/WebRTC';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {

		}
		this.signalingClient = React.createRef();
		this.webRTCConnection = React.createRef();
	}

	componentDidMount(prevProps, prevState, snapshot) {
		this.webRTCConnectionSubscribeToSignalingClient(this.signalingClient.current, this.webRTCConnection.current)
		document.addEventListener("keydown", this.webRTCConnection.current.sendKeyboardData);
	}

	webRTCConnectionSubscribeToSignalingClient(signalingClient, webRTCConnection) {
		signalingClient.webRTCConnection = webRTCConnection;
		webRTCConnection.signalingClient = signalingClient;
	}

	componentWillUnmount() {
		console.log('Component will unmount, cleanup.')
		document.removeEventListener("keydown", this.handleKeyDown);
	}

	// handleKeyDown(event) {
	// 	console.log(event)
	// 	this.webRTCConnection.sendKeyboardData(event)
	// }

	render() {
		return (
			React.createElement(
				Container,
				{ 
					id: 'tdApp',
					maxWidth: 'xl'
				 },
				React.createElement(CssBaseline, null),
				React.createElement('h1', null, 'TD WebRTC Web Demo 🍌'),
				React.createElement(
					Container,
					{
						maxWidth: 'xl',
						disableGutters: true,						
						style: {display: 'inline-flex'}
					},
					React.createElement(
						Signaling,
						{
							id: 'signalingClient',
							ref: this.signalingClient
						}
					),
					React.createElement(
						WebRTC,
						{
							id: 'webRTCConnection',
							ref: this.webRTCConnection
						}
					)
				)
			)
		);
	}
}

export default App;