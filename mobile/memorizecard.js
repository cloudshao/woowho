import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, View, Button, Image } from 'react-native';
import PortraitCard from './portraitcard';
import { S3_URL } from './App.js';

export default class MemorizeCard extends Component {
  state = {
    slideValue: new Animated.Value(450),
  }

  constructor(props) {
    super(props);
  }

  slideIn(callback) {
    this.state.slideValue.setValue(450);
    Animated.timing(this.state.slideValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
  }

  slideAway(callback){
    Animated.timing(this.state.slideValue, {
        toValue: -450,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(callback);
  }

  componentDidMount() {
    this.slideIn();
  }

  componentDidUpdate() {
    this.slideIn();
  }

  render() {
    const imageIdx = this.props.nextInterval % this.props.images.length;
    const imageSrc = {uri: S3_URL + '/' + this.props.images[imageIdx]};

    let animStyle = {
      transform: [{translateX: this.state.slideValue}]
    };

    // TODO loading icon for image
    return (
      <Animated.View style={animStyle}>
        <PortraitCard source={imageSrc}>
          <Text>MEMORIZE!</Text>
          <Button
            onPress={() => {
              this.slideAway(() => {this.props.controller.next(true);});
            }}
            title="Done" />
        </PortraitCard>
      </Animated.View>
    );
  }
}

