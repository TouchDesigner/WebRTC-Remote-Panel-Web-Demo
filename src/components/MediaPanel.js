import Container from '@mui/material/Container';

function MediaPanel(props) {
    const { mouseDataChannel, } = props;

    const componentStyle = {
        backgroundColor: 'lightGrey'
    }

    const videoStyle = {
        transform: 'scaleX(-1)'
    }

	const sendMouseData = (event) => {
		// Get video container size
		if (!mouseDataChannel) {
			console.log('The dataChannel does not exist, aborting.')
			return;
		}

		var msCont = document.getElementById('remoteVideo')
		var comStyle = window.getComputedStyle(msCont, null);
		var width = parseInt(comStyle.getPropertyValue("width"), 10);
		var height = parseInt(comStyle.getPropertyValue("height"), 10);
		
		let mouseEventDict = {
			lselect: event.buttons === 1 ? true : false,
			mselect: event.buttons === 4 ? true : false,
			rselect: event.buttons === 2 ? true : false,
			insideu: 1 - (event.nativeEvent.offsetX / width),
			insidev: 1 - (event.nativeEvent.offsetY / height)
		}
	
		sendData(JSON.stringify(mouseEventDict), mouseDataChannel);
	}

	const sendData = (data, dataChannel) => {
		if (dataChannel.readyState === 'open') {
			dataChannel.send(data);
		}
	}

	return <Container id="webRTCViewer" style={ componentStyle } disableGutters>
		<video 
			id="remoteVideo"
			width="100%"
			height="100%"
			style={ videoStyle }
			autoPlay
			muted={ false }
			controls={ false }
			onMouseDown={ sendMouseData }
			onMouseMove={ sendMouseData }
		>
		</video>
	</Container>; 
}

export default MediaPanel;