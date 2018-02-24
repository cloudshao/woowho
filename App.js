import React, {Component} from 'react';
import { AsyncStorage, FlatList, ScrollView, StyleSheet, Text, View, Button, Alert, Image } from 'react-native';
import { Person, allPeople } from './person.js';

let all = allPeople;
let newPeople = all.filter(p => p.nextInterval === null)
let seenPeople = all.filter(p => p.nextInterval !== null)

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

export default class App extends Component {
  constructor(props) {
    super(props);
    first = newPeople[0];
    this.state = {id: first.id, name: first.name, images: first.images};
    appInstance = this;
  }

  next() {
    let removed = newPeople.splice(0, 1);
    seenPeople.splice(seenPeople.length, 0, removed[0]);
    nextPerson = newPeople[0];
    if (nextPerson) {
      this.setState(previousState => {
        return {id: nextPerson.id, name: nextPerson.name, images: nextPerson.images};
      });
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
