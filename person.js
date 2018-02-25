import { S3_URL } from './App.js';
//const S3_URL = "https://s3-ap-southeast-1.amazonaws.com/cloudshao-facetraining";

export default class Person {
  constructor(id, name, images, nextInterval, dueDate) {
    this.name = name;
    this.id = id;
    this.images = images;
    this.nextInterval = nextInterval === undefined ? null : nextInterval;
    this.dueDate = dueDate === undefined ? Date.now() : dueDate;
  }
}

export async function getAllPeople() {
  return fetch(S3_URL + '/profiles.json', {
    headers: {
      'Cache-Control': 'no-cache'
    }
  }).then(
    (response) => {
      console.log(response);
      return response.json();
    }
  ).then(
    (blob) => {
      console.log(blob);
      people = deserializeFromS3(blob);
      return people;
    }
  ).catch((error) => { console.error(error); });
}

export function deserializeFromS3(json) {
  let people = {};
  for (let p of json) {
    let person = new Person(p.id, p.name, p.images)
    if (p.nextInterval !== undefined) {
      person.nextInterval = p.nextInterval;
    }
    if (p.dueDate!== undefined) {
      person.dueDate = p.dueDate;
    }
    people[p.id] = person;
  }
  return people;
}

export function summarizePeople(seen) {
  return Object.keys(seen).reduce((acc, k) => {
    acc[k] = {id: seen[k].id,
              dueDate: seen[k].dueDate,
              nextInterval: seen[k].nextInterval, };
    return acc;
  }, {});
}

export function desummarizePeople(seen, all) {
  return Object.keys(seen).reduce((acc, k) => {
    acc[k] = all[k];
    return acc;
  }, {});
}
