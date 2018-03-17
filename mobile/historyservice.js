import { AsyncStorage } from 'react-native';

class HistoryService {

  constructor() {
    this._initialized = false;
    this._history = { // List of stuff viewed today
      reviewed: [],
      introduced: [],
    }
  }

  async get() {
    if (!this._initialized) {
      try {
        const json = await AsyncStorage.getItem('@FT:historyState');
        console.log('HistoryService.get result: ' + json);
        if (json !== null) {
          const history = JSON.parse(json);
          this._history.reviewed = history.reviewed
            .map(d => new Date(d))
            .filter(d => _isToday(d));
          this._history.introduced = history.introduced
            .map(d => new Date(d))
            .filter(d => _isToday(d));
          console.log('HistoryService.get: ' + JSON.stringify(this._history));
        } else {
          console.log('HistoryService.get - No history to load');
        }
        this._initialized = true;
      } catch (error) {
        console.error(error);
        throw error;
      }
    }
    return this;
  }

  async _save() {
    const json = JSON.stringify(this._history);
    console.log('HistoryService._save: ' + json);
    await AsyncStorage.setItem('@FT:historyState', json);
  }

  async addReview() {
    this._history.reviewed.push(new Date());
    await this._save();
  }

  async addNewReview() {
    this._history.introduced.push(new Date());
    await this._save();
  }

  numReviewedToday() {
    return this._history.reviewed.length;
  }

  numNewToday() {
    return this._history.introduced.length;
  }

  reviewsPerDay() { return 20; }

  newPerDay() { return 3; }

  reachedMaxNewToday() {
    return this._history.introduced.length >= this.newPerDay();
  }
}

function _isToday(date) {
  const now = new Date();
  if (!(date <= now)) {
    throw 'historyservice._isToday: shouldnt be in the future';
  }

  // "Today" starts at 4am. So "today" can actually be the previous day
  const day = now.getHours() < 4 ? now.getDate()-1 : now.getDate();
  let thisMorning = new Date(now.getFullYear(), now.getMonth(), day, 4);

  return date >= thisMorning;
};

export default new HistoryService();
