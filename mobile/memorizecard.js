import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, Text, View, Image } from 'react-native';
import PortraitCard from './portraitcard';
import Styles from './styles';
import { S3_URL } from './App.js';
import Analytics from './analytics';
import { Event } from 'expo-analytics';

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
    const imageSrc = {uri: S3_URL + '/' + this.props.image};

    let animStyle = {
      transform: [{translateX: this.state.slideValue}]
    };

    return (
      <View>
        <Text style={Styles.title}>Memorize</Text>
        <Animated.View style={animStyle}>
          <PortraitCard source={imageSrc}>
            <Text style={Styles.name}>{this.props.displayname}</Text>
            <TouchableOpacity
              onPress={() => {
                this.slideAway(() => {this.props.controller.next(true);});
                Analytics.hit(new Event('Card', 'Memorized', this.props.id));
              }}>
              <View style={styles.stretchButton}>
                <Text style={Styles.buttonText}>&#x2713;</Text>
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
    backgroundColor: '#10752b',
    width: 300,
    height: 100,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
});
