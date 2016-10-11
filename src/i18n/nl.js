import LocaleBase from './LocaleBase';

class Locale extends LocaleBase {
  strings = {
    'required': 'Dit veld is vereist',
    'invalid': 'Ongeldig waarde',
    'pattern': 'Ongeldig waarde',
    'format': 'Ongeldig waarde',
    'true': 'Ja',
    'false': 'Nee',
    'select': {
      'addLabelText': '"{label}" toevoegen?',
      'clearAllText': 'Alles wissen',
      'clearValueText': 'Wissen',
      'noResultsText': 'Niks gevonden',
      'placeholder': 'Selecteer...',
      'searchingText': 'Word gezocht...',
      'searchPromptText': 'Typen om te zoeken'
    }
  };
}

export default Locale;
