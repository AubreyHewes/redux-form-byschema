import {isArray} from 'underscore';

export class LocaleBase {
  strings = {};
  getString (key) {
    if (isArray(key)) {
      if (this.strings[key[0]]) {
        return this.strings[key[0]];
      }
      return key[0];
    }
    if (this.strings[key]) {
      return this.strings[key];
    }
    return key;
  }
}

export default LocaleBase;
