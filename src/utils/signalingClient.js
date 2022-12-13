class SignalingClient {
    constructor(address, port, reactSetWebsocketClientsHandler, reactSetConnectedToServerHandler) {
        this.connectedToServer = false;
        this.clients = [];

        this.open(address, port, reactSetWebsocketClientsHandler, reactSetConnectedToServerHandler);

        this.reactClientsHandler = reactSetWebsocketClientsHandler;
        this.reactConnectedHandler = reactSetConnectedToServerHandler;

        this.id = -1;
    }

    open(address, port, clientsHandler, connectedHandler) {
        this.webSocket = new WebSocket(address + ':' + port)

        this.webSocket.onopen = () => {
            console.log('[WEBSOCKET] Client connected');
            this.reactConnectedHandler(true);
        };
        this.webSocket.onmessage = (message) => {
            var messageObj = JSON.parse(message.data);
            // Call message handler and bind passed react handlers
            this.onWebSocketMessageReceived(messageObj);

            // Filter out our connection from the list
            this.clients.filter(client => client.id !== this.id);
            // Pass in clients as a new array instance or it wont update
            this.reactClientsHandler([...this.clients]);
        };
        this.webSocket.onclose = (event) => {
            console.log('[WEBSOCKET] Client closed ', event.code, event.reason);
            this.reactConnectedHandler(false);
        };
        this.webSocket.onerror = (error) => {
            console.error('[WEBSOCKET] ERROR', error);
        };
    }

    close() {
        this.webSocket.close();
        // Make sur to call the react handler for proper state management
        this.reactConnectedHandler(false);
        this.reactClientsHandler([]);
    }

    setWebRTCConnection(webRTCConnection) {
        this.webRTCConnection = webRTCConnection;
    }

    /**
    * Update the websocket clients list to the one provided by the server
    * This handler is received when joining a session and will contain the clients
    * connected at the current time.
    * 
    * API Description:
    * A signaling message sent from the signaling server to a client 
    * to make it aware of other signaling clients within the signaling session
    * The signaling message type property should be set to Clients, and a list of clients 
    * should be set in the clients property of the content dictionary.
    * @param {*} message.clients
    */
    onClientsMessage(message) {
        console.log("[WEBSOCKET] On Clients", message);
        let { clients } = message.content;

        return clients;
    }

    /**
    * Received when a new client joins the session
    * 
    * API Description:
    * A signaling message sent from the signaling server to clients in the signaling session 
    * to make them aware that a client entered the signaling session.
    * The signaling message type property should be set to ClientEnter, and a Client dictionary 
    * should be set in the client property of the content dictionary.
    * 
    * @param {*} message 
    */
    onClientEnter(message, previousClients) {
        console.log("[WEBSOCKET] On Client Enter", message);
        const { id, address, properties } = message.content.client;

        let index = previousClients.findIndex(object => object.id === id);
            console.log(index)
        // index is -1 if the desired if is not owned by any client in previousClients
        if(index === -1) {
            previousClients.push({id, address, properties});
        }
        
        return previousClients;
    }

    /**
    * Confirmation from the server that we are connected to its signaling session
    * The contained informations are relative to this websocket client.
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
        // Here we receive de React app websocket client`s information
        console.log("[WEBSOCKET] On Client Entered");
        const { self } = message.content;
        console.log(self);
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
    onClientExit(message, previousClients) {
        console.log("[WEBSOCKET] On Client Exit", message);
        const { client } = message.content;
        const { id } = client;

        return previousClients.filter(c => c.id !== id);
    }

    // Route websockets message to the right handler
    onWebSocketMessageReceived(messageObject) {
        // Message follow the TD Signaling API JSON Schema syntax
        // See https://docs.derivative.ca/Palette:signalingServer#Signaling_API
        const {signalingType} = messageObject;
        
        switch(signalingType) {
            case 'Clients':
                this.clients = this.onClientsMessage(messageObject);
                break;
            case 'ClientEnter':
                this.clients = this.onClientEnter(messageObject, this.clients);
                break;
            case 'ClientEntered':
                this.onClientEntered(messageObject);
                break;
            case 'ClientExit':
                this.clients = this.onClientExit(messageObject, this.clients);
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