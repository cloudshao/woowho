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
import Styles from './styles'

export const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

let allPeople = {};
let newPeople = {};
let seenPeople = new Map();
let loaded = false;

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
    throw error;
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
    console.log("Error in load: " + error);
    throw error;
  }

  loaded = true;
}

//AsyncStorage.clear(); 

export default class App extends Component
{
  state = {side: 'front',
           cur: null,
           nextCardDueDate:new Date(3000, 1),
           score: 0,
           numDue: 0,
           numNew: 0,
           error: null};

  constructor(props) {
    super(props);

    this._load();

    this._handleAppStateChange = this._handleAppStateChange.bind(this);
    this._refreshDonePage = this._refreshDonePage.bind(this);
  }

  _load() {
    load().then(() => {
      this.showCard();
    }).catch((error) => {
      console.log("Setting error text: " + error);
      this.setState({error:error});
    });
  }

  componentDidMount() {
    AppState.addEventListener('change', this._handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this._handleAppStateChange);
  }

  async _handleAppStateChange(nextAppState) {
    if (nextAppState === 'active') {
      if (this.state.error != null) {
        this.setState({error: null});
      }

      if (!loaded) {
        this._load();
        return;
      }

      if (this.state.cur === null) {
        this.showCard(); // Refresh to see if any new ones are due
        return;
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
    let score = 0;
    seenKeys.forEach((k) => {
      const p = seenPeople.get(k)
      console.log('showCard - seen person: ' + p.id + ' ' + p.dueDate.toLocaleString());

      if (p.dueDate < new Date()) {
        firstSeen = p;
        numDue++;
      }

      if (p.dueDate < closestDueDate) {
        closestDueDate = p.dueDate;
      }

      if (p.nextInterval > 1) {
        score += p.nextInterval-1;
      }
    });

    const reachedDailyReviewLimit = numDue + history.numReviewedToday() >= history.reviewsPerDay();
    const numNew = reachedDailyReviewLimit ? 0 : Math.min(history.newPerDay() - history.numNewToday(), Object.keys(newPeople).length);

    this.setState({numNew: numNew, numDue: numDue, score: score});

    console.log("showCard Due: " + numDue);
    console.log("showCard history.numReviewedToday: " + history.numReviewedToday());
    console.log("showCard history.numNewToday: " + history.numNewToday());
    console.log("showCard history.newPerDay: " + history.newPerDay());
    console.log("showCard numNewLhs: " + (history.newPerDay() - history.numNewToday()));
    console.log("showCard newPeople.length: " + Object.keys(newPeople).length);
    console.log("showCard new: " + numNew);

    // Draw from new list
    if (numNew > 0) {
      let firstKey = null;
      for (let k in newPeople) { firstKey = k; break; }
      let first = newPeople[firstKey];
      if (first) {
        console.log('Showing new: ' + JSON.stringify(first));
        this.setState({side:'front', cur:first});
        return;
      }
    }

    // Draw from seen list
    if (firstSeen) {
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
    setTimeout(this._refreshDonePage, 20000);
  }

  _refreshDonePage() {
    console.log('_refreshDonePage');
    if (this.state.cur == null) {
      this.showCard();
    }
  }

  async next(answer) { // TODO rename this and showCard

    const wasNew = this.state.cur.nextInterval === 0;
    if (wasNew) {
      delete newPeople[this.state.cur.id];
    }

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

    try {
      save();
      const history = await HistoryService.get().catch(e => console.error(e));
      await wasNew ? history.addNewReview() : history.addReview();
      this.showCard();
    } catch (error) {
      this.state.error = error;
    }
  }

  flipCard() {
    this.setState({side: 'back'});
  }

  _getContentsToRender() {

    const score = this.state.score <= 0 ? null :
      <Text style={styles.statusText}>&#11088; {this.state.score*100}</Text>;
    const due = this.state.numDue <= 0 ? null :
      <Text style={styles.statusText}>&#129300; {this.state.numDue}</Text>;
    const newText = this.state.numNew <= 0 ? null :
      <Text style={styles.statusText}>&#128566; {this.state.numNew}</Text>;
    const statusBar = 
      (<View style={styles.statusBar}>
        {score}
        {newText}
        {due}
      </View>);

    if (this.state.error != null) {
      return (
        <View>
          <View style={styles.donePage}>
            <Text style={Styles.title}>
              (&#65377;&bull;&#769;&#65087;&bull;&#768;&#65377;){"\n"}
              Boohoo!{"\n\n"}
              {this.state.error.toString()}
            </Text>
          </View>
        </View>
      );
    }

    if (!loaded) {
      return (
        <View style={styles.loadingIndicator}>
          <ActivityIndicator size="large" color="black" />
        </View>
      );
    }

    if (this.state.cur === null) {
      return (
        <View>
          <View style={styles.donePage}>
            <Text style={Styles.title}>
              (&#3665;&#707;&#821;&#7447;&#706;&#821;)&#1608;{"\n"}
              Woohoo!{"\n\n"}
              Next card{"\n"}
              {moment(this.state.nextCardDueDate).fromNow()}
            </Text>
          </View>
          {statusBar}
        </View>
      );
    }

    if (this.state.side !== 'front') {
      return (
        <View>
          <AnswerCard id={this.state.cur.id}
                displayname={this.state.cur.displayname}
                images={this.state.cur.images}
                dueDate={this.state.cur.dueDate.toLocaleString()}
                nextInterval={this.state.cur.nextInterval}
                controller={this}/>
          {statusBar}
        </View>
      );
    }

    if (this.state.cur.nextInterval === 0) {
      return (
        <View>
          <MemorizeCard id={this.state.cur.id}
            displayname={this.state.cur.displayname}
            images={this.state.cur.images}
            dueDate={this.state.cur.dueDate.toLocaleString()}
            nextInterval={this.state.cur.nextInterval}
            controller={this} />
          {statusBar}
        </View>
      );
    }

    return (
      <View>
        <Card id={this.state.cur.id}
           displayname={this.state.cur.displayname}
           images={this.state.cur.images}
           dueDate={this.state.cur.dueDate.toLocaleString()}
           nextInterval={this.state.cur.nextInterval}
           controller={this} />
        {statusBar}
      </View>
    );
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
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#e8e8e8',
  },
  loadingIndicator: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  donePage: {
    marginTop: 100,
    marginBottom: 60,
  },
  statusBar: {
    flex: -1,
    flexDirection: 'row',
    width: 300,
    marginTop: 60,
  },
  statusText: {
    marginRight: 10,
  }
});
