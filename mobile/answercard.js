import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, View, Button, Image } from 'react-native';
import PortraitCard from './portraitcard';
import { S3_URL } from './App.js';

export default class AnswerCard extends Component {
  state = {
    spinValue: new Animated.Value(0),
    slideValue: new Animated.Value(0),
  }

  constructor(props) {
    super(props);
  }

  componentDidMount(){
    Animated.timing(this.state.spinValue, {
        toValue: 100,
        duration: 300,
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

  spinInterp = this.state.spinValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['-90deg', '0deg']
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
          <Text>Name: {this.props.displayname}</Text>
          <Text>Next interval: {this.props.nextInterval}</Text>
          <Button
            onPress={() => {
              this.slideAway(() => {this.props.controller.next(true);});
            }}
            title="Right" />
          <Button
            onPress={() => {
              this.slideAway(() => {this.props.controller.next(false);});
            }}
            title="Wrong" />
        </PortraitCard>
      </Animated.View>
    );
  }
}

