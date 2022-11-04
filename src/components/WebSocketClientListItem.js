import React from 'react';
import { ListItem, ListItemButton, ListItemText } from '@mui/material';

/**
 * Component representing a Websocket client connected to the Signaling server.
 * A user can either connect (Start call) to it's data stream, or disconnect (End call)
 * @param {*} props 
 * @returns JSX to be rendered
 */

function WebSocketClientListItem(props) {
	// CSS Styling
    const componentStyle = {
		display: 'inline-block'
	}
	const listItemTextStyle = {
		width: '100%',
		fontSize: '10px'
	}

	let { id, address, properties, signalingClient } = props;
	console.log('WebSocketClient', id, address, properties, signalingClient);

	const handleClickStartCall = () => {
		if(!!signalingClient.webRTCConnection)
			signalingClient.webRTCConnection.onCallStart(address, properties);
	}

	const handleClickEndCall = () => {
		if(!!signalingClient.webRTCConnection)
			signalingClient.webRTCConnection.onCallEnd();
	}

	return <ListItem key={ id } style={ componentStyle } disableGutters>
		<ListItemText primary= { address } style={ listItemTextStyle }></ListItemText>
		<ListItemButton component='a'>
			<ListItemText primary='Start' onClick={ handleClickStartCall }></ListItemText>
		</ListItemButton>
		<ListItemButton component='a'>
			<ListItemText primary='End' onClick={ handleClickEndCall }></ListItemText>
		</ListItemButton>
	</ListItem>;
}

export default WebSocketClientListItem;