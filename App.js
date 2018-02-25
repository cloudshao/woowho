import React, {Component} from 'react';
import { AsyncStorage, FlatList, ScrollView, StyleSheet, Text, View, Button, Alert, Image } from 'react-native';
import { Person, getAllPeople, deserializePeople } from './person.js';

export const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

/*
let allPeople = getAllPeople();
let newPeople = allPeople.filter(p => p.nextInterval === null)
let seenPeople = allPeople.filter(p => p.nextInterval !== null)
*/
let allPeople = [];
let newPeople = [];
let seenPeople = [];

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
  // Persist
  let dto = {seen:seenPeople, unused:null};
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
    const json = await AsyncStorage.getItem('@FT:saveState');
    if (json !== null){
      console.log('Loading: ' + json );
      seenPeople = deserializePeople(json);
    }

    allPeople = await getAllPeople();
    console.log('allPeople: ' + allPeople);
    newPeople = allPeople.filter(p => {
      for (const s of seenPeople) {
        if (p.id === s.id) return false;
      }
      return true;
    });
    console.log('newPeople: ' + newPeople);
  } catch (error) {
    console.error(error);
  }
}

//AsyncStorage.clear(); 

export default class App extends Component {
  constructor(props) {
    super(props);
    //first = newPeople[0];
    this.state = {id: 'placeholder', name: 'Placeholder', images: [], dueDate: null, nextInterval: null};
    appInstance = this;

    load().then(() => {
      this.showNextCard();
    });
  }

  showNextCard() {
    first = newPeople[0];
    if (first) {
      console.log('Showing: ' + JSON.stringify(first));
      this.setState({id: first.id, name: first.name, images: first.images, dueDate: first.dueDate, nextInterval: first.nextInterval});
    } else {
      this.setState({id: null});
    }
  }

  next() {
    let removed = newPeople.splice(0, 1);
    seenPeople.splice(seenPeople.length, 0, removed[0]);

    save();
    showNextCard();
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
