import { Container, Button, TextField, List, ListItem, ListItemButton, ListItemText } from '@mui/material';

function SignalingClientPanel(props) {
    const { clients, address, port, connectedToServer} = props;

    const componentStyle = {
		backgroundColor: "darkgray",
		width: "20%"
	}
    const buttonStyle = {
        marginTop: 2 
    }

    const listStyle = {
		display: 'inline-block'
	}
	const listItemTextStyle = {
		width: '100%',
		fontSize: '10px'
	}

    const handleAddressChange = (event) => {
		// console.log('Signaling Host Address was changed');
		// setAddress(event.target.value);
	}

	const handlePortChange = (event) => {
		// console.log('Signaling Host Port was changed');
		// setPort(event.target.value);
	}

	const handleClickConnect = (event) => {
		// // TODO: Check if already a WS instance
		// if (ws && ws.OPEN) {
		// 	var protocol = (window.location.protocol === 'https:') ? 'wss://' : 'ws://';
		// 	ws = new W3CWebSocket(protocol + address + ':' + port);
		// }

		// // TODO: Set button to connected state
		// console.log('Signaling Host was changed (or connected) to: ' + ws);
	} 

	return <Container id="tdSignaling" style={ componentStyle }>
		<h2>Signaling server settings: </h2>
		<h3>IP Address</h3>
		<TextField variant='standard' label='Address' id='adress' defaultValue={ address }>{ address }</TextField>
        <h3>Port</h3>
        <TextField variant='standard' label='Port' id='port' defaultValue={ port }></TextField>
		<Button variant='contained' id='btnConnect' style={ buttonStyle } disabled={connectedToServer}>Connect</Button>
        <h4>Connected to server: {connectedToServer ? 'Yes' : 'No'}</h4>
		<Container id="tdSignalingList" disableGutters>
			<h3>Signaling clients list </h3>
			<List className='clients'>
				{
                    clients.map((wsClient, i) => {
                        const { id, address } = wsClient;

                        return <ListItem key={ id } style={ listStyle } disableGutters>
                            <ListItemText primary= { address } style={ listItemTextStyle }></ListItemText>
                            <ListItemButton component='a'>
                                <ListItemText primary='Start'></ListItemText>
                            </ListItemButton>
                            <ListItemButton component='a'>
                                <ListItemText primary='End'></ListItemText>
                            </ListItemButton>
                        </ListItem>;
                    })
				}
			</List>
		</Container>
	</Container>;
}

export default SignalingClientPanel;