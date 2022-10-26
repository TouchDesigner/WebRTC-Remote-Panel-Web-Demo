import React, { Component } from 'react';
import { ListItem, ListItemButton, ListItemText } from '@mui/material';

class TDClient extends Component {
	constructor(props) {
		super(props);
		this.state = {};
		this.id = props.id;
		this.address = props.address;
		this.properties = props.properties;
		this.signalingClient = props.parent;

        // CSS Styling
        this.componentStyle = {
            display: 'inline-block'
        }
        this.listItemTextStyle = {
            width: '100%',
            fontSize: '10px'
        }
	}

	componentDidMount() {}

	componentWillUnmount() {}

	handleClickStartCall = (e) => {
		this.signalingClient.webRTCConnection.onCallStart(this);
	}

	handleClickEndCall = (e) => {
		this.signalingClient.webRTCConnection.onCallEnd(this);
	}

	render() {
        return <ListItem key={ this.id } style={ this.componentStyle } disableGutters>
            <ListItemText primary= { this.address } style={ this.listItemTextStyle }></ListItemText>
            <ListItemButton component='a'>
                <ListItemText primary='Start' onClick={ this.handleClickStartCall }></ListItemText>
            </ListItemButton>
            <ListItemButton component='a'>
                <ListItemText primary='End' onClick={ this.handleClickEndCall }></ListItemText>
            </ListItemButton>
        </ListItem>;
	}
}

export default TDClient;