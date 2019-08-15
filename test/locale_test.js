import test from "ava";

import Locale from "../src/i18n/LocaleBase";

const locale = new Locale();
locale.strings = { known: "@known" };

test("unknown key should return key", t => {
  t.is(locale.getString("unknown"), "unknown");
});

test("known key should return key", t => {
  t.is(locale.getString("known"), "@known");
});
