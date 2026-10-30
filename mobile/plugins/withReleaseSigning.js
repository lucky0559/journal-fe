// Signs the Android release build with the Play upload key when ~/.android/journal-signing.properties exists
// (storeFile, storePassword, keyAlias, keyPassword); otherwise it falls back to the debug key, like the Expo template.
// A config plugin, so the change survives `expo prebuild --clean`. The key and its password stay outside the repo.
const { withAppBuildGradle } = require('expo/config-plugins');

const LOADER = `
def journalSigning = new Properties()
def journalSigningFile = new File(System.getProperty('user.home'), '.android/journal-signing.properties')
if (journalSigningFile.exists()) { journalSigningFile.withInputStream { journalSigning.load(it) } }
`;

const RELEASE_CONFIG = `
        release {
            if (journalSigning.containsKey('storeFile')) {
                storeFile file(journalSigning['storeFile'])
                storePassword journalSigning['storePassword']
                keyAlias journalSigning['keyAlias']
                keyPassword journalSigning['keyPassword']
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes('journalSigning')) return cfg;
    const before = g;
    g = g.replace(/\nandroid \{/, `${LOADER}\nandroid {`);
    g = g.replace(/signingConfigs \{/, `signingConfigs {${RELEASE_CONFIG}`);
    g = g.replace(
      /(see https:\/\/reactnative\.dev\/docs\/signed-apk-android\.\s*\n\s*)signingConfig signingConfigs\.debug/,
      "$1signingConfig journalSigning.containsKey('storeFile') ? signingConfigs.release : signingConfigs.debug",
    );
    if (g === before || !g.includes('signingConfigs.release')) throw new Error('withReleaseSigning: build.gradle did not match the expected template');
    cfg.modResults.contents = g;
    return cfg;
  });
};
