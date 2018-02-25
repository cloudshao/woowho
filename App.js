import React, {Component} from 'react';
import { AsyncStorage, FlatList, ScrollView, StyleSheet, Text, View, Button, Alert, Image } from 'react-native';
import { Person, getAllPeople, desummarizePeople, summarizePeople} from './person.js';

export const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

let allPeople = {};
let newPeople = {};
let seenPeople = {};

let appInstance = null;

class Card extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    console.log('this.props: ' + JSON.stringify(this.props));

    return (
      <View style={styles.container}>
        <Image source={{uri: S3_URL + '/' + this.props.images[0]}}
               style={styles.portrait} />
        <Text>ID: {this.props.id}</Text>
        <Text>Name: {this.props.name}</Text>
        <Text>Images: {this.props.images.length} {this.props.images}</Text>
        <Text>Due date: {this.props.dueDate}</Text>
        <Text>Next interval: {this.props.nextInterval}</Text>
        <Button
          onPress={() => {appInstance.next();}}
          title="Seen" />
        <Button
          onPress={() => {Alert.alert('You tapped');}}
          title="Unseen" />
      </View>
    );
  }
}

async function save() {
  console.log('seenPeople: ' + JSON.stringify(seenPeople));
  let dto = summarizePeople(seenPeople);
  let serialized = JSON.stringify(dto);
  console.log('Saving: ' + serialized);

  try {
    await AsyncStorage.setItem('@FT:saveState', serialized);
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  try {
    // Load full list from S3
    allPeople = await getAllPeople();
    console.log('allPeople: ' + JSON.stringify(allPeople));

    // Load seen list from local storage
    const json = await AsyncStorage.getItem('@FT:saveState');
    if (json !== null){
      console.log('Loading: ' + json );
      const summarized = JSON.parse(json);
      seenPeople = desummarizePeople(summarized, allPeople);
      console.log('seenPeople: ' + JSON.stringify(seenPeople));
    }

    const newKeys = Object.keys(allPeople).filter(k => !(k in seenPeople));
    console.log('newKeys: ' + JSON.stringify(newKeys));
    newPeople = newKeys.reduce((acc, k) => {
      acc[k] = allPeople[k];
      return acc;
    }, {});
    console.log('newPeople: ' + JSON.stringify(newPeople));
  } catch (error) {
    console.error(error);
  }
}

//AsyncStorage.clear(); 

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {id: 'placeholder', name: 'Placeholder', images: [], dueDate: null, nextInterval: null};
    appInstance = this;

    load().then(() => {
      this.showCard();
    });
  }

  showCard() {
    let firstKey = null;
    for (let k in newPeople) { firstKey = k; break; }
    const first = newPeople[firstKey];
    if (first) {
      console.log('Showing: ' + JSON.stringify(first));
      this.setState({id: first.id, name: first.name, images: first.images, dueDate: first.dueDate, nextInterval: first.nextInterval});
    } else {
      this.setState({id: null});
    }
  }

  next() {
    console.assert(this.state.id in newPeople);
    const removed = newPeople[this.state.id];
    delete newPeople[this.state.id];
    console.assert(!(this.state.id in seenPeople));
    seenPeople[this.state.id] = removed;

    save();
    this.showCard();
  }

  render() {
    if (this.state.id !== null) {
      return (
        <View style={styles.container}>
          <Card id={this.state.id}
                name={this.state.name}
                images={this.state.images}
                dueDate={this.state.dueDate}
                nextInterval={this.state.nextInterval}/>
        </View>
      );
    } else {
      return (
        <View style={styles.container}>
          <Text>No more cards for today!</Text>
        </View>
      );
    }
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
