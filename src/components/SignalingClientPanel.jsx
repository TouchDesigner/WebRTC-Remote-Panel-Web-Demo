import {
	Container,
	Button,
	TextField,
	List,
	ListItem,
	ListItemButton,
	ListItemText,
	Divider,
	useTheme,
	useMediaQuery,
} from "@mui/material";

function SignalingClientPanel(props) {
	// React properties passed in App.js
	const {
		clients,
		address,
		port,
		connectedToServer,
		signalingClient,
		webRTCConnection,
		setPortHandler,
		setAddressHandler,
	} = props;

	const theme = useTheme();

	const isMedium = useMediaQuery(theme.breakpoints.down("md"));
	const isLarge = useMediaQuery(theme.breakpoints.down("lg"));
	const isXLarge = useMediaQuery(theme.breakpoints.down("xl"));

	// CSS Styling
	const componentStyle = {
		backgroundColor: "darkgray",
		width: isMedium ? "100%" : isLarge ? "100%" : isXLarge ? "100%" : "20%",
	};
	const buttonStyle = {
		marginTop: 2,
	};
	const listStyle = {
		display: "inline-block",
	};
	const listItemTextStyle = {
		width: "100%",
		fontSize: "10px",
	};

	// Event handlers bound to text fields, they use the passed properties functions
	const handleAddressChange = (event) => {
		console.log("Signaling Host Address was changed");
		setAddressHandler(event.target.value);
	};
	const handlePortChange = (event) => {
		console.log("Signaling Host Port was changed");
		setPortHandler(event.target.value);
	};

	return (
		<Container id="tdSignaling" style={componentStyle}>
			<h2>Signaling server settings: </h2>
			<h3>IP Address</h3>
			<TextField
				variant="standard"
				label="Address"
				id="adress"
				defaultValue={address}
				disabled={connectedToServer}
				onChange={(event) => handleAddressChange(event)}
			>
				{address}
			</TextField>
			<h3>Port</h3>
			<TextField
				variant="standard"
				label="Port"
				id="port"
				defaultValue={port}
				disabled={connectedToServer}
				onChange={(event) => handlePortChange(event)}
			></TextField>
			<Button
				variant="contained"
				id="btnConnect"
				style={buttonStyle}
				disabled={connectedToServer}
				onClick={() => signalingClient.open(address, port)}
			>
				Connect
			</Button>
			<Button
				variant="contained"
				id="btnDisconnect"
				style={buttonStyle}
				disabled={!connectedToServer}
				onClick={() => signalingClient.close()}
			>
				Disconnect
			</Button>
			<h4>Connected to server: {connectedToServer ? "Yes" : "No"}</h4>
			<Divider />
			<Container id="tdSignalingList" disableGutters>
				<h3>Signaling clients list </h3>
				<List className="clients">
					{
						// List out Websocket clients and add handlers to bind them to a Web RTC session
						clients.map((wsClient, i) => {
							const { id, address, properties } = wsClient;

							// Returns a React component to be rendered
							return (
								<ListItem key={id} style={listStyle} disableGutters>
									<ListItemText
										primary={address}
										style={listItemTextStyle}
									></ListItemText>
									<ListItemText
										secondary={id}
										style={listItemTextStyle}
									></ListItemText>
									<ListItemButton component="a">
										<ListItemText
											primary="Start"
											onClick={() =>
												webRTCConnection.onCallStart(address, properties)
											}
										></ListItemText>
									</ListItemButton>
									<ListItemButton component="a">
										<ListItemText
											primary="End"
											onClick={() => webRTCConnection.onCallEnd()}
										></ListItemText>
									</ListItemButton>
								</ListItem>
							);
						})
					}
				</List>
			</Container>
		</Container>
	);
}

export default SignalingClientPanel;
