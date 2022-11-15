import { w3cwebsocket as W3CWebSocket } from "websocket";

class SignalingClient {
    constructor(address, port, reactSetWebsocketClientsHandler, reactSetConnectedToserverHandler) {
        this.connectedToServer = false;
        this.clients = [];
        this.reactSetWebsocketClientsHandler = reactSetWebsocketClientsHandler;
        this.reactSetConnectedToserverHandler = reactSetConnectedToserverHandler;

        this.open(address, port);
    }

    open(address, port) {
        this.webSocket = new W3CWebSocket('ws://' + address + ':' + port);

        this.webSocket.onopen = () => {
            console.log('[WEBSOCKET] Client connected');
        };
        this.webSocket.onmessage = (message) => {
            var messageObj = JSON.parse(message.data);
            // Call message handler and bind passed react handlers
            this.onWebSocketMessageReceived(messageObj, this.reactSetWebsocketClientsHandler, this.reactSetConnectedToserverHandler);
        };
        this.webSocket.onclose = () => {
            console.log('[WEBSOCKET] Client closed');
        };
        this.webSocket.onerror = (error) => {
            console.error('[WEBSOCKET] ERROR ', error);
        };
    }

    close() {
        this.webSocket.close();
        // Make sur to call the react handler for proper state management
        this.reactSetConnectedToserverHandler(false);
        this.reactSetWebsocketClientsHandler([]);
    }

    setWebRTCConnection(webRTCConnection) {
        this.webRTCConnection = webRTCConnection;
    }

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
    onClientsMessage(message, previousClients) {
        // let wsClientsTempArray = [];
        let { clients } = message.content;
        
        // var wsClientsTempArray= [];
        // clients.some(function (client) {
        // 	let { id, address, properties } = client;
        
        // 	// TODO: Make sure self is not added to this list
        // 	// This method should be called in the Map, we should be storing an object
        // 	let newWSClient = { id, address, properties };
        // 	wsClientsTempArray = [...previousClients];
        // 	wsClientsTempArray.push(newWSClient);
        
        // 	return wsClientsTempArray;
        // });

        // console.log(clients, wsClientsTempArray);

        return clients;
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
    onClientEnter(message) {
        console.log("[WEBSOCKET] On Client Enter", message);
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
    onClientEntered(message) {
        const { self } = message.content;
        // Here we receive de React app websocket client`s information
        console.log("[WEBSOCKET] On Client Entered", self);
        // Assign properties of the websocket to this instance
        this.id = self.id;
        this.assignedAddress = self.address;
        this.properties = self.properties;
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
    onClientExit(message) {
        console.log("[WEBSOCKET] On Client Exit", message);
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
    onWebSocketMessageReceived(messageObject, clientsReactHandler, connectedReactHandler) {
        // Message follow the TD Signaling API JSON Schema syntax
        // See https://docs.derivative.ca/Palette:signalingServer#Signaling_API
        const {signalingType} = messageObject;
        
        switch(signalingType) {
            case 'Clients':
                let clients = this.onClientsMessage(messageObject, this.clients);
                clientsReactHandler(clients);
                break;
            case 'ClientEnter':
                this.onClientEnter(messageObject);
                break;
            case 'ClientEntered':
                this.onClientEntered(messageObject);
                connectedReactHandler(true);
                break;
            case 'ClientExit':
                this.onClientExit(messageObject);
                break;
            default:
                // If not a know message, we delegate to the WebRTC Connection for negotiation
                let signalingClientMessagesTypes = ['Offer', 'Answer', 'Ice'];
                
                // If the message contains signaling negotiation types and the Web RTC Connection reference object has been set
                if (signalingClientMessagesTypes.indexOf(messageObject.signalingType) > -1 && !!this.webRTCConnection) {
                    // Delegate to the WebRTCConnection reference object
                    this.webRTCConnection.onMessageReceived(messageObject);
                } else {
                    console.log('[] No match was found in the WebRTC Messages Signaling Negociation Types.')
                }
        }
    }
}

export default SignalingClient;