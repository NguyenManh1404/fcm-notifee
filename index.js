/**
 * @format
 */

import notifee from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  const {data} = remoteMessage || {};
});

notifee.onBackgroundEvent(async ({detail}) => {
  const {notification} = detail;
  const {data, title} = notification || {};
});

AppRegistry.registerComponent(appName, () => App);
