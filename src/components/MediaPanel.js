import Container from '@mui/material/Container';

function MediaPanel(props) {
    const { mouseDataChannel, keyboardDataChannel } = props;

    const componentStyle = {
        backgroundColor: 'lightGrey'
    }

    const videoStyle = {
        transform: 'scaleX(-1)',
		width: '100%'
    }

	// Send data on both mouse down and move to mock interactions on TD leapPaint
	const sendMouseData = (event) => {
		if (!mouseDataChannel) {
			console.log('The dataChannel does not exist, aborting.')
			return;
		}

		var msCont = document.getElementById('remoteVideo')
		var comStyle = window.getComputedStyle(msCont, null);
		var width = parseInt(comStyle.getPropertyValue("width"), 10);
		var height = parseInt(comStyle.getPropertyValue("height"), 10);
		
		// Mouse event related to Derivatives JSON API
		let mouseEventDict = {
			lselect: event.buttons === 1 ? true : false,
			mselect: event.buttons === 4 ? true : false,
			rselect: event.buttons === 2 ? true : false,
			insideu: 1 - (event.nativeEvent.offsetX / width),
			insidev: 1 - (event.nativeEvent.offsetY / height)
		}

		if (mouseDataChannel.readyState === 'open') {
			mouseDataChannel.send(
				JSON.stringify(mouseEventDict)
			);
		}
	}

	const sendKeyboardData = (event) => {
		if (!keyboardDataChannel) {
			console.log('The dataChannel does not exist, aborting.')
			return;
		}

		let keyboardEventDict = {
			type: event.type,
			key: event.key,
			code: event.code,
			location: event.location,
			repeat: event.repeat,
			isComposing: event.isComposing,
			ctrlKey: event.ctrlKey,
			shiftKey: event.shiftKey,
			altKey: event.altKey,
			metaKey: event.metaKey
		}

		if (keyboardDataChannel.readyState === 'open') {
			keyboardDataChannel.send(JSON.stringify(keyboardEventDict));
		}
	}

	return <Container id="webRTCViewer" style={ componentStyle } disableGutters>
		<video 
			id="remoteVideo"
			style={ videoStyle }
			autoPlay
			muted={ false }
			controls={ false }
			onMouseDown={ sendMouseData }
			onMouseMove={ sendMouseData }
			onKeyPress= { sendKeyboardData }
		>
		</video>
	</Container>; 
}

export default MediaPanel;