import LocaleBase from './LocaleBase';

class Locale extends LocaleBase {
  strings = {
    'required': 'This is a required field',
    'invalid': 'Invalid value',
    'pattern': 'Invalid pattern',
    'format': 'Invalid format',
    'enum': 'Invalid value',
    'true': 'Yes',
    'false': 'No',
    addNew: 'Add new %s',
    delete: 'Remove'
  };
}

export default Locale;
