import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, View, Button, Image } from 'react-native';
import { S3_URL } from './App.js';

export default class AnswerCard extends Component {
  state = {
    spinValue: new Animated.Value(0),
  }

  constructor(props) {
    super(props);
  }

  componentDidMount(){
    Animated.timing(this.state.spinValue, {
        toValue: 100,
        duration: 300,
        easing: Easing.out(Easing.cubic),
      }).start();
  }

  spinInterp = this.state.spinValue.interpolate({
    inputRange: [0, 100],
    outputRange: ['-90deg', '0deg']
  });

  render() {

    const imageIdx = this.props.nextInterval % this.props.images.length;

    let animStyle = {
      transform: [{rotateY: this.spinInterp}]
    };

    return (
      <Animated.View style={[styles.container, animStyle]}>
        <View style={styles.container}>
          <Image source={{uri: S3_URL + '/' + this.props.images[imageIdx]}}
                 style={styles.portrait} />
          <Text>ID: {this.props.id}</Text>
          <Text>Name: {this.props.displayname}</Text>
          <Text>Images: {this.props.images.length} {this.props.images}</Text>
          <Text>Due date: {this.props.dueDate}</Text>
          <Text>Current date: {Date.now()}</Text>
          <Text>Next interval: {this.props.nextInterval}</Text>
          <Button
            onPress={() => {this.props.controller.next(true);}}
            title="Right" />
          <Button
            onPress={() => {this.props.controller.next(false);}}
            title="Wrong" />
        </View>
      </Animated.View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  portrait: {
    width: 200,
    height: 200,
  },
});
