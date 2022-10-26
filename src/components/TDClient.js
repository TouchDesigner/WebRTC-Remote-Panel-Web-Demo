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
	}

	componentDidMount() {
	}

	componentWillUnmount() {
	}

	handleClickStartCall = (e) => {
		this.signalingClient.webRTCConnection.onCallStart(this);
	}

	handleClickEndCall = (e) => {
		this.signalingClient.webRTCConnection.onCallEnd(this);
	}

	render() {
		return (
			React.createElement(
				ListItem, 
				{ 
					key: this.id,
					style: {
						display: 'inline-block'
					},
					disableGutters: true
				},
				React.createElement(
					ListItemText, 
					{ 
						primary: this.address,
						style: {
							width: '100%',
							fontSize: '10px'
						}
					}
				),
				React.createElement(
					ListItemButton,
					{ component: 'a' },
					React.createElement(
						ListItemText,
						{
							primary: 'Start',
							onClick: this.handleClickStartCall
						}
					)
				),
				React.createElement(
					ListItemButton,
					{ component: 'a' },
					React.createElement(
						ListItemText,
						{
							primary: 'End',
							onClick: this.handleClickEndCall
						}
					)
				)
			)
		);
	}
}

export default TDClient;