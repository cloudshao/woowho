import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, View, Image } from 'react-native';
import Touchable from 'react-native-platform-touchable';
import PortraitCard from './portraitcard';
import Styles from './styles';
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
      <View>
        <Text style={Styles.title}>Were you right?</Text>
        <Animated.View style={animStyle}>
          <PortraitCard source={imageSrc}>
            <Text style={Styles.name}>{this.props.displayname}</Text>
            <View style={styles.buttonContainer}>
              <Touchable
                background={Touchable.SelectableBackground}
                onPress={() => {
                  this.slideAway(() => {this.props.controller.next(false);});
                }}>
                <View style={styles.leftButton}>
                  <Text style={Styles.buttonText}>&#x2717;</Text>
                </View>
              </Touchable>
              <Touchable
                background={Touchable.SelectableBackground}
                onPress={() => {
                  this.slideAway(() => {this.props.controller.next(true);});
                }}>
                <View style={styles.rightButton}>
                  <Text style={Styles.buttonText}>&#x2713;</Text>
                </View>
              </Touchable>
            </View>
          </PortraitCard>
        </Animated.View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: -1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    width: 300,
    height: 100,
  },
  leftButton: {
    flex: -1,
    justifyContent: 'center',
    backgroundColor: '#8e0c0c',
    width: 150,
    height: 100,
    borderBottomLeftRadius: 10,
  },
  rightButton: {
    flex: -1,
    justifyContent: 'center',
    backgroundColor: '#10752b',
    width: 150,
    height: 100,
    borderBottomRightRadius: 10,
  },
});
