import React, {Component} from 'react';
import { AsyncStorage, AppState, StyleSheet, Text, View, Button, Image } from 'react-native';
import Person, { getAllPeople, desummarizePeople, summarizePeople} from './person.js';

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
        <Text>Current date: {Date.now()}</Text>
        <Text>Next interval: {this.props.nextInterval}</Text>
        <Button
          onPress={() => {appInstance.next(true);}}
          title="Seen" />
        <Button
          onPress={() => {appInstance.next(false);}}
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
  console.log('Current time: ' + Date.now());

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

  state = {cur: {id: 'placeholder', name: 'Placeholder', images: [], dueDate: null, nextInterval: null}};

  constructor(props) {
    super(props);
    appInstance = this;

    load().then(() => {
      this.showCard();
    });
  }

  showCard() {
    let firstKey = null;

    // Draw from new list
    for (let k in newPeople) { firstKey = k; break; }
    let first = newPeople[firstKey];
    if (first) {
      delete newPeople[firstKey];
      console.log('Showing: ' + JSON.stringify(first));
      this.setState({cur:first});
      return;
    }

    // Draw from seen list
    for (let k in seenPeople) {
      if (seenPeople[k].dueDate < Date.now())
      {
        firstKey = k; break;
      }
    }
    first = seenPeople[firstKey];
    if (first) {
      // TODO duplicate code
      delete seenPeople[firstKey];
      console.log('Showing: ' + JSON.stringify(first));
      this.setState({cur:first});
      return;
    }

    this.setState({cur:new Person(null, null, null)});
  }

  next(answer) {
    // TODO evaluate answer properly
    if (answer) { // correct
      this.state.cur.dueDate = Date.now() + 10000;
    } else {
      this.state.cur.dueDate = Date.now();
    }
    seenPeople[this.state.cur.id] = this.state.cur;

    save();
    this.showCard();
  }

  render() {
    if (this.state.cur.id !== null) {
      return (
        <View style={styles.container}>
          <Card id={this.state.cur.id}
                name={this.state.cur.name}
                images={this.state.cur.images}
                dueDate={this.state.cur.dueDate}
                nextInterval={this.state.cur.nextInterval}/>
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
