/**
 * @providesModule Vimeo
 * @flow
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import PropTypes from 'prop-types';

function getVimeoPageURL(uri, videoId) {
    return uri + '?id=' + videoId;
}

// NOTE: Injecting code here due to react-native webview issues when overriding
// the onMessage method. See here: https://github.com/facebook/react-native/issues/10865
export const injectedCode = `
(function() {
var originalPostMessage = window.postMessage;
var patchedPostMessage = function(message, targetOrigin, transfer) {
  originalPostMessage(message, targetOrigin, transfer);
};
patchedPostMessage.toString = function() {
  return String(Object.hasOwnProperty).replace('hasOwnProperty', 'postMessage');
};
window.postMessage = patchedPostMessage;

})();
`;

export default class Vimeo extends React.Component {
    static propTypes = {
        videoId: PropTypes.string.isRequired,
        onReady: PropTypes.func,
        onPlay: PropTypes.func,
        onPlayProgress: PropTypes.func,
        onPause: PropTypes.func,
        onFinish: PropTypes.func,
        scalesPageToFit: PropTypes.bool,
        baseURI: PropTypes.string.isRequired
    };

    constructor() {
        super();
        this.handlers = {};
        this.state = {
            ready: false
        };
    }

    componentDidMount() {
        this.registerHandlers();
    }

    componentWillReceiveProps() {
        this.registerHandlers();
    }

    api(method, cb) {
        if (!this.state.ready) {
            throw new Error(
                'You cannot use the `api` method until `onReady` has been called'
            );
        }
        this.webView.postMessage(method);

        this.registerBridgeEventHandler(method, cb);
    }

    registerHandlers() {
        this.registerBridgeEventHandler('ready', this.onReady);
        this.registerBridgeEventHandler('play', this.props.onPlay);
        this.registerBridgeEventHandler(
            'playProgress',
            this.props.onPlayProgress
        );
        this.registerBridgeEventHandler('pause', this.props.onPause);
        this.registerBridgeEventHandler('finish', this.props.onFinish);
    }

    registerBridgeEventHandler(eventName, handler) {
        this.handlers[eventName] = handler;
    }

    onBridgeMessage = event => {
        let message = event.nativeEvent.data;
        let payload;
        try {
            payload = JSON.parse(message);
        } catch (err) {
            return;
        }
        let handler = this.handlers[payload.name];
        if (handler) handler(payload.data);
    };

    onReady = () => {
        this.setState({ ready: true });
        // Defer calling `this.props.onReady`. This ensures
        // that `this.state.ready` will be updated to
        // `true` by the time it is called.
        if (this.props.onReady) setTimeout(this.props.onReady);
    };

    render() {
        return (
            <WebView
                ref={ref => (this.webView = ref)}
                style={{
                    // Accounts for player border
                    marginTop: -8,
                    marginLeft: -10,
                    height: this.props.height
                }}
                injectedJavaScript={injectedCode}
                source={{
                    uri: getVimeoPageURL(this.props.baseURI, this.props.videoId)
                }}
                scalesPageToFit={this.props.scalesPageToFit}
                scrollEnabled={false}
                onMessage={this.onBridgeMessage.bind(this)}
                allowsInlineMediaPlayback={true}
                onError={error => console.error(error)}
            />
        );
    }
}
