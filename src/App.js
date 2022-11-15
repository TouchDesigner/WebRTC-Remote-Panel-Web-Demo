import React, { useState, useEffect } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';

// Import local components
import SignalingClientPanel from './components/SignalingClientPanel';
import MediaPanel from './components/MediaPanel';

// Handles and util fonctions
import WebRTCConnection from './utils/webRTCConnection';
import SignalingClient from './utils/signalingClient';

function App() {
	// App state management à la React
	const [port, setPort] = useState(9980);
	const [address, setAddress] = useState('127.0.0.1');
	const [webSocketClients, setWebSocketClients] = useState([]);
	const [connectedToServer, setConnectedToServer] = useState(false);
	const [mouseDataChannel, setMouseDataChannel] = useState();
	const [signalingClient, setSignalingClient] = useState();
	const [webRTCConnection, setWebRTCConnection ] = useState();

	/************************************************************************
	 * React app rendering
	 */
	// We need to use the useEffect hook in order to not open a ws at every refresh
	useEffect(
		() => {
			// Instantiate Websocket and bing its handlers
			let signalingClient = new SignalingClient(address, port, setWebSocketClients, setConnectedToServer);			
			let webRTCConnection = new WebRTCConnection(signalingClient, setMouseDataChannel);

			setSignalingClient(signalingClient);
			setWebRTCConnection(webRTCConnection);

			// Disconnect when done
			return () => {
				// Close websocket
				signalingClient.close();
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
				clients={ webSocketClients } 
				connectedToServer={ connectedToServer }
				signalingClient={ signalingClient }
				webRTCConnection={ webRTCConnection }
				setPortHandler={setPort}
				setAddressHandler={setAddress}
			/>
			<MediaPanel mouseDataChannel={ mouseDataChannel } />
		</Container>
	</Container>;
}

export default App;