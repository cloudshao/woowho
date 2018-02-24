import React, {Component} from 'react';
import { AsyncStorage, FlatList, ScrollView, StyleSheet, Text, View, Button, Alert, Image } from 'react-native';
import { Person, allPeople, deserializePeople } from './person.js';

let newPeople = allPeople.filter(p => p.nextInterval === null)
let seenPeople = allPeople.filter(p => p.nextInterval !== null)

let appInstance = null;

class Card extends Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <View style={styles.container}>
        <Text>My Id: {this.props.id}</Text>
        <Text>Hello {this.props.name}</Text>
        <Text>My images: {this.props.images}</Text>
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
      // We have data!!
      console.log('Loading: ' + json );
      seenPeople = deserializePeople(json);
      newPeople = allPeople.filter(p => {
        for (const s of seenPeople) {
          if (p.id === s.id) return false; //
        }
        return true;
      });
      console.log('newPeople: ' + newPeople);
    }
  } catch (error) {
    console.error(error);
  }
}

//AsyncStorage.clear(); 

export default class App extends Component {
  constructor(props) {
    super(props);
    first = newPeople[0];
    this.state = {id: first.id, name: first.name, images: first.images};
    appInstance = this;

    load().then(() => {
      first = newPeople[0];
      if (first) {
        this.setState({id: first.id, name: first.name, images: first.images});
      } else {
        this.setState({id: null});
      }
    });
  }

  next() {
    let removed = newPeople.splice(0, 1);
    seenPeople.splice(seenPeople.length, 0, removed[0]);

    save();

    nextPerson = newPeople[0];
    if (nextPerson) {
      this.setState({id: nextPerson.id, name: nextPerson.name, images: nextPerson.images});
    } else {
      this.setState({id: null});
    }
  }

  render() {
    if (this.state.id !== null) {
      let id = this.state.id;
      let name = this.state.name;
      let images = this.state.images;
      return (
        <View style={styles.container}>
          <Card id={id}
                name={name}
                images={images}/>
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
  image: {
    width: 200,
    height: 200,
  },
});
