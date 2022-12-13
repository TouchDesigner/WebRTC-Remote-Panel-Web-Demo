# Get the project running locally

To run the project locally, you will need to first clone this repository.

You need to have installed [NodeJS](https://nodejs.org/en/): LTS Version: 18.12.1 (includes npm 8.19.2)

In the project cloned repository folder, use:
`npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.
You may also see any lint errors in the console.

## Secure the project in the development server:

If you want to run the project on your own machine and rely on SSL, you will need to run the development server of your NodeJS project by passing the following environment variables

```
HTTPS=true
SSL_CRT_FILE=PATH TO FILE.crt
SSL_KEY_FILE=PATH TO FILE.key
```

where you set a relative path to the .crt and .key files such as `./localhost.crt` and `./localhost.key`.

As an alternative, you can also edit the package.json file with the following start script:

```
    "start": "set HTTPS=true&&set SSL_CRT_FILE=PATH TO FILE.crt&&set SSL_KEY_FILE=PATH TO FILE.key&&react-scripts start"
```

You will need a server certificate. To generate development certificates, you can follow instructions on this page's section "Getting a development certificate".

# Use the web demo page

A live web demo page can be used at the following link: https://touchdesigner.github.io/WebRTC-Remote-Panel-Web-Demo/

For the web demo page to connect with a local signalingServer, you will need a server certificate. You can follow instructions on this page's section "Getting a development certificate".

Development certificates come with limitations as they are not recognized by the certificate authority.

If you are familiar with certificate authorities, you can get your own valid certificate installed on the signalingServer.

If you use a development certificate, you will want to add this certificate to your browser (In Chrome: Settings -> Privacy and Security -> Security -> Manage device certificates) **or** first hit the IP of your signalingServer in a browser using `https://` to temporarily add the server certificate to Chrome.

# TouchDesigner setup

In TouchDesigner, you need a signalingServer COMP (Palette -> WebRTC), where you could have to turn on the Secure toggle if you use TLS as well as to set the certificate and key parameters.

You will need a signalingClient running locally or on another machine, with the toggle to "Forward to subscribers" turned on. 

The WebRTCRemotePanel COMP should be setup as well with its signalingClient parameter set (where the signalingClient you created is referenced) and a compatible panel.

# Limitations

Unfortunately, not all components will work nicely with that specific setup, but a large array of simple setups should be covered.

Issues you might sometimes encounter are click not being registered, or dialogs not appearing.

A general rule of thumb is to avoid opening dialogs. I.e. Don't open from your custom component a Parameter dialog, but embed the parameters in your UI through widgets or Parameter COMPs.

Keyboard input is currently not supported (but partly designed in the code for future use).

Touch screens input from phones is partly supported.

# Perfect negotation

The project should more or less follow the perfect negotiation as presented in the following links, with small tweaks based on the Signaling messages schemas.

One main difference is how we determine which Signaling Client will be polite.

When using the TouchDesigner Signaling Server, the signalingServer COMP will return a "join time" to the client when acknowledging that the client joined the session.

This is the "join time" that will determine which signalingClient will be polite or unpolite.

- [Mozilla](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)
- [Google's example](https://github.com/webrtc/samples/tree/gh-pages/src/content/peerconnection/perfect-negotiation)
- [WebRTC Basics](https://web.dev/webrtc-basics/)

# Getting a development certificate

To get your own development certificate we suggest to use mkcert: https://github.com/FiloSottile/mkcert

Follow the instructions to install.

Once install, open a cmd terminal in the folder of your TouchDesigner project and use the following command to generate a local server certificate:

```
mkcert -install
mkcert -cert-file tdServer.crt -key-file tdServer.key localhost 127.0.0.1
```

This will create the files tdServer.crt and tdServer.key at the root of your folder. 

You can now use those files on the signalingServer COMP

# JSON Schemas

All of TD's own Signaling API is defined at the following repository with various schema files: https://github.com/TouchDesigner/SignalingAPI

# Publishing (for devs only and contributors)

Updating the Github hosted page can be done with write permissions using 

```
npm run deploy
```

As per: https://create-react-app.dev/docs/deployment/

The homepage in package.json should be of the likes of 

```
"homepage": "https://myusername.github.io/my-app",
```