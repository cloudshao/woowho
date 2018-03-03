import React, {Component} from 'react';
import { StyleSheet, Text, View, Button, Image } from 'react-native';
import { S3_URL } from './App.js';

export default class Card extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    const imageIdx = this.props.nextInterval % this.props.images.length;

    return (
      <View style={styles.container}>
        <Image source={{uri: S3_URL + '/' + this.props.images[imageIdx]}}
               style={styles.portrait} />
        <Text>ID: {this.props.id}</Text>
        <Text>Images: {this.props.images.length} {this.props.images}</Text>
        <Text>Due date: {this.props.dueDate.toLocaleString()}</Text>
        <Text>Current date: {new Date().toLocaleString()}</Text>
        <Text>Next interval: {this.props.nextInterval}</Text>
        <Button
          onPress={() => {this.props.controller.flipCard(true);}}
          title="Show Answer" />
      </View>
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
