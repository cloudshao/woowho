import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, View, Button, Image } from 'react-native';
import { S3_URL } from './App.js';
import PortraitCard from './portraitcard';

export default class Card extends Component {
  state = {
    spinValue: new Animated.Value(0),
    slideValue: new Animated.Value(450),
  }

  constructor(props) {
    super(props);
  }

  componentDidMount(){
    Animated.timing(this.state.slideValue, {
        toValue: 0,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
  }

  spin(callback) {
    Animated.timing(this.state.spinValue, {
        toValue: 100,
        duration: 100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(callback);
  }

  spinInterp = this.state.spinValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '90deg']
  });

  render() {

    const imageIdx = this.props.nextInterval % this.props.images.length;
    const imageSrc = {uri: S3_URL + '/' + this.props.images[imageIdx]};

    let animStyle = {
      transform: [{rotateY: this.spinInterp},
                  {translateX: this.state.slideValue}]
    };

    return (
      <Animated.View style={animStyle}>
        <PortraitCard source={imageSrc}>
          <Text>Next interval: {this.props.nextInterval}</Text>
          <Button
            onPress={() => {this.spin(() => {this.props.controller.flipCard(true);})}}
            title="Show Answer" />
        </PortraitCard>
      </Animated.View>
    );
  }
}

