import { AsyncStorage } from 'react-native';
import HistoryService from './historyservice'
import Person, { getAllPeople, desummarizePeople, summarizePeople} from './person.js';

//AsyncStorage.clear(); // For testing only

function shuffle(array) {
  let shuffled = array
    .map((a) => ({sort: Math.random(), value: a}))
    .sort((a, b) => a.sort - b.sort)
    .map((a) => a.value);
  return shuffled;
}

class CardService {

  _cur = null;
  _allPeople = new Map();
  _newPeople = new Map();
  _seenPeople = new Map();
  _numNew = null;
  _numDue = null;
  _score = null;
  _closestDueDate = new Date(3000, 1);

  numNew() { return this._numNew; }
  numDue() { return this._numDue; }
  score() { return this._score; }
  closestDueDate() {
    if (this.numNew() > 0) {
      const now = new Date();
      tomorrowMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 4); // 4 am tomorrow
      return tomorrowMorning;
    }
    return this._closestDueDate;
  }

  constructor() {
    this._initialized = false;
  }

  async get() {
    if (!this._initialized) {
      await this._loadFromServer();
      await this.draw();
      this._initialized = true;
    }
    return this;
  }

  async _loadFromServer() {
    try {
      // Load full list from S3
      this._allPeople = await getAllPeople();

      // Load seen list from local storage
      const json = await AsyncStorage.getItem('@FT:saveState');
      if (json !== null){
        const summarized = JSON.parse(json);
        this._seenPeople = desummarizePeople(summarized, this._allPeople);
      }

      const newKeys = [...this._allPeople.keys()].filter(k => !this._seenPeople.has(k));
      this._newPeople = newKeys.reduce((acc, k) => {
        acc.set(k, this._allPeople.get(k));
        return acc;
      }, new Map());
    } catch (error) {
      console.error("Error in load: " + error);
      throw error;
    }
  }

  async _save() {
    let dto = summarizePeople(this._seenPeople);
    let serialized = JSON.stringify(dto);
    console.log('Saving: ' + serialized);
    console.log('Current time: ' + new Date());

    try {
      await AsyncStorage.setItem('@FT:saveState', serialized);
    } catch (error) {
      throw error;
    }
  }

  // Advances to the next card and returns it
  async advance(answer) {

    if (!this._cur) {
      return null;
    }

    const wasNew = this._cur.nextInterval === 0;
    if (wasNew) {
      this._newPeople.delete(this._cur.id);
    }

    if (!answer) { // incorrect
      this._cur.reset();
    }

    // Write the card back into seen list
    this._cur.advance();
    this._seenPeople.set(this._cur.id, this._cur);

    // Persist
    await this._save();
    const history = await HistoryService.get();
    await wasNew ? history.addNewReview() : history.addReview();

    return await this.draw();
  }

  // Draw a new card without changing state
  async draw() {
    const history = await HistoryService.get();

    // TODO perf? We shouldn't need to shuffle to draw randomly
    const now = new Date();
    let seenKeys = [...this._seenPeople.keys()];
    console.log("draw seenKeys: " + JSON.stringify(seenKeys));
    seenKeys = shuffle(seenKeys);

    // TODO split this into separate function for readability
    // Figure out next due, total due and accumulated score in one loop
    let closestDueDate = new Date(3000, 1);
    let firstSeen = null;
    let numDue = 0;
    let score = 0;
    seenKeys.forEach((k) => {
      const p = this._seenPeople.get(k)

      if (p.dueDate < new Date()) {
        firstSeen = p;
        numDue++;
      }

      console.log("draw compare " + JSON.stringify(p.dueDate) + " to " + JSON.stringify(closestDueDate));
      if (p.dueDate < closestDueDate) {
        closestDueDate = p.dueDate;
      }

      if (p.nextInterval > 1) {
        score += p.nextInterval-1;
      }
    });
    console.log("draw seenPeople: " + JSON.stringify([...this._seenPeople]));

    const reachedDailyReviewLimit = numDue + history.numReviewedToday() >= history.reviewsPerDay();
    const numNew = reachedDailyReviewLimit ? 0 : Math.min(history.newPerDay() - history.numNewToday(), this._newPeople.size);

    this._numNew = numNew;
    this._numDue = numDue;
    this._score = score;
    this._closestDueDate = closestDueDate;

    console.log("draw Due: " + numDue);
    console.log("draw history.numReviewedToday: " + history.numReviewedToday());
    console.log("draw history.numNewToday: " + history.numNewToday());
    console.log("draw history.newPerDay: " + history.newPerDay());
    console.log("draw numNewLhs: " + (history.newPerDay() - history.numNewToday()));
    console.log("draw newPeople.length: " + this._newPeople.size);
    console.log("draw new: " + numNew);
    console.log("draw closestDueDate: " + this._closestDueDate);

    // Draw from new list
    if (numNew > 0) {
      let firstNew;
      for (let [k, v] of this._newPeople) { firstNew = v; break; }
      if (firstNew) {
        console.log('draw showing new: ' + JSON.stringify(firstNew));
        this._cur = firstNew;
        return this._cur;
      }
    }

    // Draw from seen list
    if (firstSeen) {
      console.log('draw showing seen: ' + JSON.stringify(firstSeen));
      this._cur = firstSeen;
      return this._cur;
    }

    // No cards left
    console.log('draw no cards remaining');
    this._cur = null;
    return this._cur;
  }

  current() {
    return this._cur;
  }

}

export default new CardService();
