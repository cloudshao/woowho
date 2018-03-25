if (!__DEV__) {
  //console.log = () => {};
  //console.error = () => {};
}

import moment from 'moment'
import React, {Component} from 'react';
import { ActivityIndicator, AsyncStorage, AppState, StyleSheet, Text, View, Button, Image } from 'react-native';
import AnswerCard from './answercard'
import Card from './card'
import CardService from './cardservice'
import MemorizeCard from './memorizecard'
import Styles from './styles'

export const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

let loaded = false;

async function save() {
  const cardservice = await CardService.get();
  await cardservice.save();
}

async function load() {
  await CardService.get();
  loaded = true;
}

export default class App extends Component
{
  state = {side: 'front',
           cur: null,
           closestDueDate:new Date(3000, 1),
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
      console.log("_load then");
      this.showCard();
    }).catch((error) => {
      console.error("Setting error text: " + error);
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
      }
    }
  }

  async showCard() {
    await this._refreshStats();

    const cardservice = await CardService.get();
    const card = cardservice.current();
    if (card) {
      this.setState({side:'front', cur:card});
      console.log('showCard: ' + JSON.stringify(card));
      return;
    }

    // No card to show. Refresh in a while
    console.log('showCard none to show');
    setTimeout(this._refreshDonePage, 20000);
  }

  async _refreshDonePage() {
    console.log('_refreshDonePage');
    if (this.state.cur == null) {
      const cardservice = await CardService.get();
      const card = await cardservice.draw();
      await this.showCard(); // TODO error handle?
    }
  }

  async next(answer) {
    try {
      const cardservice = await CardService.get();
      console.log("next advance");
      await cardservice.advance(answer);
      await this.showCard();
    } catch (error) {
      console.error(error);
      this.setState({error: error});
    }
  }

  flipCard() {
    this.setState({side: 'back'});
  }

  async _refreshStats() {
    console.log("_refreshStats");
    const cardservice = await CardService.get();
    this.setState({
      numNew: cardservice.numNew(),
      numDue: cardservice.numDue(),
      score: cardservice.score(),
      closestDueDate: cardservice.closestDueDate(),
    });
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
              {moment(this.state.closestDueDate).fromNow()}
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
                image={this.state.cur.currentImage()}
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
            image={this.state.cur.currentImage()}
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
           image={this.state.cur.currentImage()}
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
