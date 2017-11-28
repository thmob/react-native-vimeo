/**
 * @providesModule Vimeo
 * @flow
 */
import React from 'react';
import {
  StyleSheet,
  WebView
} from 'react-native';

import PropTypes from 'prop-types';


function getVimeoPageURL(uri, videoId) {
  return uri + '?id=' + videoId;
}


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
  }

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
      throw new Error('You cannot use the `api` method until `onReady` has been called');
    }
    this.refs.webviewBridge.sendToBridge(method);
    this.registerBridgeEventHandler(method, cb);
  }

  registerHandlers() {
    this.registerBridgeEventHandler('ready', this.onReady);
    this.registerBridgeEventHandler('play', this.props.onPlay);
    this.registerBridgeEventHandler('playProgress', this.props.onPlayProgress);
    this.registerBridgeEventHandler('pause', this.props.onPause);
    this.registerBridgeEventHandler('finish', this.props.onFinish);
  }

  registerBridgeEventHandler(eventName, handler) {
    this.handlers[eventName] = handler;
  }

  onBridgeMessage = (message) => {
    let payload;
    try {
      payload = JSON.parse(message);
    } catch (err) {
      return;
    }
    let handler = this.handlers[payload.name];
    if (handler) handler(payload.data);
  }

  onReady = () => {
    this.setState({ ready: true });
    // Defer calling `this.props.onReady`. This ensures
    // that `this.state.ready` will be updated to
    // `true` by the time it is called.
    if (this.props.onReady) setTimeout(this.props.onReady);
  }

  render() {
    return (
      <WebView
        ref="webviewBridge"
        style={{
          // Accounts for player border
          marginTop: -8,
          marginLeft: -10,
          height: this.props.height
        }}
        source={{ uri: getVimeoPageURL(this.props.baseURI, this.props.videoId) }}
        scalesPageToFit={this.props.scalesPageToFit}
        scrollEnabled={false}
        onBridgeMessage={this.onBridgeMessage}
        onError={(error) => console.error(error)}
      />
    );
  }

}
