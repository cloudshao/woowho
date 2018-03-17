import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { S3_URL } from './App.js';
import Styles from './styles';
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
      <View>
        <Text style={Styles.title}>Who is this?</Text>
        <Animated.View style={animStyle}>
          <PortraitCard source={imageSrc}>
            <TouchableOpacity
              onPress={() => {this.spin(() => {this.props.controller.flipCard(true);})}}>
              <View style={styles.stretchButton}>
                <Text style={Styles.buttonText}>&#10555;</Text>
              </View>
            </TouchableOpacity>
          </PortraitCard>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  stretchButton: {
    flex: -1,
    justifyContent: 'center',
    backgroundColor: '#628cdb',
    width: 300,
    height: 100,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
