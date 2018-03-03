import { AsyncStorage } from 'react-native';

class HistoryService {

  constructor() {
    this._initialized = false;
    this._history = {
      reviewed: [],
      introduced: [],
    }
  }

  async get() {
    if (!this._initialized) {
      const json = await AsyncStorage.getItem('@FT:historyState');
      if (json !== null) {
        console.log('HistoryService.get: ' + json);
        const history = JSON.parse(json);
        this._history.reviewed = history.reviewed
          .map(d => new Date(d))
          .filter(d => _isToday(d));
        this._history.introduced = history.introduced
          .map(d => new Date(d))
          .filter(d => _isToday(d));
      } else {
        console.log('HistoryService.get - Unable to load history');
      }

      this._initialized = true;
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

  anyViewedToday() {
    return this._history.reviewed.length > 0 ||
           this._history.introduced.length > 0;
  }

  reachedMaxToday() {
    return this._history.reviewed.length + this._history.introduced.length >= 10;
  }

  reachedMaxNewToday() {
    return this._history.introduced.length >= 3;
  }
}

function _isToday(date) {
  const now = new Date();
  if (!(date <= now)) {
    throw 'historyservice._isToday: shouldnt be in the future';
  }
  let thisMorning = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4);
  return date >= thisMorning;
};

export default new HistoryService();
