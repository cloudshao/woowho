import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, View, TouchableHighlight, Image } from 'react-native';
import PortraitCard from './portraitcard';
import Styles from './styles';
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
      <View>
        <Text style={Styles.title}>Memorize</Text>
        <Animated.View style={animStyle}>
          <PortraitCard source={imageSrc}>
            <TouchableHighlight
              onPress={() => {
                this.slideAway(() => {this.props.controller.next(true);});
              }}>
              <View style={styles.stretchButton}>
                <Text style={Styles.buttonText}>&#x2713;</Text>
              </View>
            </TouchableHighlight>
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
    backgroundColor: '#10752b',
    width: 300,
    height: 100,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
