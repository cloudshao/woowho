import Image from 'react-native-image-progress';
import ProgressCircle from 'react-native-progress/Circle';
import React, {Component} from 'react';
import { StyleSheet, View } from 'react-native';
import { S3_URL } from './App.js';

export default class PortraitCard extends Component {

  constructor(props) {
    super(props);
  }

  render() {

    // TODO loading icon for image
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          {this.props.children}
        </View>
        <Image source={this.props.source}
               indicator={ProgressCircle}
               style={styles.portrait} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    marginTop: 100,
  },
  card: {
    flex: -1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 100,
    borderRadius: 10,
    backgroundColor: 'white',
    width: 300,
    height: 300,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  portrait: {
    position: 'absolute',
    top: -100,
    left: 50,
    width: 200,
    height: 230,
  },
});
