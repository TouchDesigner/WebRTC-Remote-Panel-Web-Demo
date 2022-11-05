import Container from '@mui/material/Container';

function MediaPanel(props) {
    const { sendMouseData } = props;

    const componentStyle = {
        backgroundColor: 'lightGrey'
    }

    const videoStyle = {
        transform: 'scaleX(-1)'
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