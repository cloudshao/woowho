import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
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

    const imageSrc = {uri: S3_URL + '/' + this.props.image};

    let animStyle = {
      transform: [{rotateY: this.spinInterp},
                  {translateX: this.state.slideValue}]
    };

    const score = this.props.nextInterval > 1 ? 
        <Text style={styles.score}>
          &#11088; {100*(this.props.nextInterval-1)}
        </Text> :
        null;

    return (
      <View>
        <Text style={Styles.title}>Were you right?</Text>
        <Animated.View style={animStyle}>
          <PortraitCard source={imageSrc}>
            {score}
            <Text style={Styles.name}>{this.props.displayname}</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  this.slideAway(() => {this.props.controller.next(false);});
                }}>
                <View style={styles.leftButton}>
                  <Text style={Styles.buttonText}>&times;</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  this.slideAway(() => {this.props.controller.next(true);});
                }}>
                <View style={styles.rightButton}>
                  <Text style={Styles.buttonText}>&#x2713;</Text>
                </View>
              </TouchableOpacity>
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
  score: {
    textAlign: 'left',
    fontSize: 20,
    marginLeft: 20,
    color: '#555',
    width: 300,
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
