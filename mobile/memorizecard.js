import React, {Component} from 'react';
import { Animated, Easing, StyleSheet, Text, View, Button, Image } from 'react-native';
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

    let animStyle = {
      transform: [{translateX: this.state.slideValue}]
    };

    // TODO loading icon for image
    return (
      <Animated.View style={[styles.container, animStyle]}>
        <View style={styles.container}>
          <Text>MEMORIZE!</Text>
          <Image source={{uri: S3_URL + '/' + this.props.images[imageIdx]}}
                 style={styles.portrait} />
          <Text>ID: {this.props.id}</Text>
          <Text>Name: {this.props.displayname}</Text>
          <Text>Images: {this.props.images.length} {this.props.images}</Text>
          <Text>Due date: {this.props.dueDate.toLocaleString()}</Text>
          <Text>Current date: {new Date().toLocaleString()}</Text>
          <Text>Next interval: {this.props.nextInterval}</Text>
          <Button
            onPress={() => {
              this.slideAway(() => {this.props.controller.next(true);});
            }}
            title="Done" />
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
