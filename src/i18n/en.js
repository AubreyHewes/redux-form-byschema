import LocaleBase from './LocaleBase';

class Locale extends LocaleBase {
  strings = {
    'required': 'This is a required field',
    'invalid': 'Invalid value',
    'pattern': 'Invalid pattern',
    'format': 'Invalid format',
    'true': 'Yes',
    'false': 'No'
  };
}

export default Locale;
