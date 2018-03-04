import React, {Component} from 'react';
import { StyleSheet, Text, View, Button, Image } from 'react-native';
import { S3_URL } from './App.js';

export default class MemorizeCard extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    const imageIdx = this.props.nextInterval % this.props.images.length;

    // TODO loading icon for image
    return (
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
          onPress={() => {this.props.controller.next(true);}}
          title="Done" />
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
