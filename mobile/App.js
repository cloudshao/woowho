if (!__DEV__) {
  console.log = () => {};
}

import moment from 'moment'
import React, {Component} from 'react';
import { ActivityIndicator, AsyncStorage, AppState, StyleSheet, Text, View, Button, Image } from 'react-native';
import Person, { getAllPeople, desummarizePeople, summarizePeople} from './person.js';
import Card from './card'
import AnswerCard from './answercard'
import MemorizeCard from './memorizecard'
import HistoryService from './historyservice'

export const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

let allPeople = {};
let newPeople = {};
let seenPeople = new Map();
let loading = true;

// Maps nextInterval -> next due time in milliseconds
// First one is a special case handled in the code
const dueIntervals = [NaN, 1, 3, 8, 21, 49, 109, 245];

function shuffle(array) {
  let shuffled = array
    .map((a) => ({sort: Math.random(), value: a}))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
  return shuffled;
}

async function save() {
  console.log('seenPeople: ' + JSON.stringify(seenPeople));
  let dto = summarizePeople(seenPeople);
  let serialized = JSON.stringify(dto);
  console.log('Saving: ' + serialized);
  console.log('Current time: ' + new Date());

  try {
    await AsyncStorage.setItem('@FT:saveState', serialized);
  } catch (error) {
    console.error(error);
  }
}

async function load() {
  loading = true;
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
      console.log('loaded seenPeople: ' + seenPeople);
    }

    const newKeys = Object.keys(allPeople).filter(k => !seenPeople.has(k));
    console.log('newKeys: ' + JSON.stringify(newKeys));
    newPeople = newKeys.reduce((acc, k) => {
      acc[k] = allPeople[k];
      return acc;
    }, {});
    console.log('newPeople: ' + JSON.stringify(newPeople));
  } catch (error) {
    console.error(error);
  } finally {
    loading = false;
  }
}

//AsyncStorage.clear(); 

export default class App extends Component
{
  state = {side: 'front', cur: null, nextCardDueDate:new Date(3000, 1)};

  constructor(props) {
    super(props);

    load().then(() => {
      this.showCard();
    });

    this._handleAppStateChange = this._handleAppStateChange.bind(this);
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  async _handleAppStateChange(nextAppState) {
    if (nextAppState === 'active') {
      if (this.state.cur === null && !loading) {
        this.showCard(); // Refresh to see if any new ones are due
      }
    }
  }

  async showCard() {
    console.log('showCard');

    const history = await HistoryService.get();

    // TODO perf? We shouldn't need to shuffle to draw randomly
    const now = new Date();
    let closestDueDate = new Date(3000, 1);
    let seenKeys = [...seenPeople.keys()];
    seenKeys = shuffle(seenKeys);
    let firstSeen = null;
    let numDue = 0;
    seenKeys.forEach((k) => {
      const p = seenPeople.get(k)
      console.log('showCard - seen person: ' + p.id + ' ' + p.dueDate.toLocaleString());

      if (p.dueDate < new Date())
      {
        firstSeen = p;
        numDue++;
      }

      if (p.dueDate < closestDueDate) {
        closestDueDate = p.dueDate;
      }
    });

    console.log("showCard Due: " + numDue);
    console.log("showCard history.numReviewedToday: " + history.numReviewedToday());
    console.log("showCard history.numNewToday: " + history.numNewToday());

    // Draw from new list
    if (!history.reachedMaxNewToday() &&
        numDue + history.numReviewedToday() < history.reviewsPerDay()) {
      let firstKey = null;
      for (let k in newPeople) { firstKey = k; break; }
      let first = newPeople[firstKey];
      if (first) {
        delete newPeople[firstKey];
        console.log('Showing: ' + JSON.stringify(first));
        this.setState({side:'front', cur:first});
        return;
      }
    }

    // Draw from seen list
    if (firstSeen) {
      seenPeople.delete(firstSeen.id);
      console.log('Showing: ' + JSON.stringify(firstSeen));
      this.setState({side:'front', cur:firstSeen});
      return;
    }

    console.log('showCard - closestDueDate: ' + closestDueDate.toLocaleString());
    if (newPeople.length > 0) {
      const now = new Date();
      closestDueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 4); // 4 am tomorrow
    }
    console.log('showCard - closestDueDate counting new: ' + closestDueDate.toLocaleString());
    this.setState({nextCardDueDate:closestDueDate, cur:null})
  }

  async next(answer) { // TODO rename this and showCard
    const wasNew = this.state.cur.nextInterval === 0;

    if (!answer) { // incorrect
      this.state.cur.nextInterval = 0;
    }

    // Figure out when this card is due next
    const now = new Date();
    if (this.state.cur.nextInterval === 0) { // Special case for first view
      this.state.cur.nextInterval++;
      this.state.cur.dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes()+10); // 10 minutes
    } else {
      const dueIntervalIndex = Math.min(this.state.cur.nextInterval, dueIntervals.length);
      const daysUntilDue = dueIntervals[dueIntervalIndex];
      this.state.cur.nextInterval++;
      const dueDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()+daysUntilDue, 4); // 4 am on that day
      this.state.cur.dueDate = dueDate;
    }

    seenPeople.set(this.state.cur.id, this.state.cur);

    save();
    // TODO handle potential errors here
    const history = await HistoryService.get();
    await wasNew ? history.addNewReview() : history.addReview();
    this.showCard();
  }

  flipCard() {
    this.setState({side: 'back'});
  }

  _getContentsToRender() {
    if (loading) {
      return (
        <View>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text>Loading...</Text>
        </View>
      );
    }

    if (this.state.cur === null) {
      return (
        <View style={styles.container}>
          <Text>No more cards for today!</Text>
          <Text>Current time: {new Date().toLocaleString()}</Text>
          <Text>Next card due: {moment(this.state.nextCardDueDate).fromNow()}</Text>
        </View>
      );
    }

    if (this.state.side !== 'front') {
      return (
        <View style={styles.container}>
          <AnswerCard id={this.state.cur.id}
                displayname={this.state.cur.displayname}
                images={this.state.cur.images}
                dueDate={this.state.cur.dueDate.toLocaleString()}
                nextInterval={this.state.cur.nextInterval}
                controller={this}/>
        </View>
      );
    }

    return this.state.cur.nextInterval === 0 ?
      (<MemorizeCard id={this.state.cur.id}
           displayname={this.state.cur.displayname}
           images={this.state.cur.images}
           dueDate={this.state.cur.dueDate.toLocaleString()}
           nextInterval={this.state.cur.nextInterval}
           controller={this} />) :
      (<Card id={this.state.cur.id}
           displayname={this.state.cur.displayname}
           images={this.state.cur.images}
           dueDate={this.state.cur.dueDate.toLocaleString()}
           nextInterval={this.state.cur.nextInterval}
           controller={this} />);
  }

  render() {
    console.log("Render: " + JSON.stringify(this.state.cur));
    return (
      <View style={styles.container}>
        {this._getContentsToRender()}
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
    backgroundColor: '#8cc136',
  },
});
