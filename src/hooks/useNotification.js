import notifee, {
  AndroidBadgeIconType,
  AndroidImportance,
  AndroidVisibility,
  EventType,
} from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import {useEffect} from 'react';
import {Platform} from 'react-native';

const IS_ANDROID = Platform.OS === 'android';

export const SHOULD_REQUEST_NOTIFICATION_ANDROID =
  IS_ANDROID && Platform.Version >= 33;

const NOTIFICATION_APPROVED_STATUSES = [
  messaging.AuthorizationStatus.AUTHORIZED,
];

const androidPressNotificationHandler = (remoteMessage, isQuitApp = false) => {
  const {data, notification} = remoteMessage;
  const {title} = notification || {};
};

const displayNotification = async ({
  id,
  title,
  body,
  data,
  androidImage,
} = {}) => {
  try {
    // Create a channel (required for Android)
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
    });

    // Request permissions (required for iOS)
    await notifee.requestPermission();

    const attachments = data?.fcm_options?.image
      ? [
          {
            url: data?.fcm_options?.image,
          },
        ]
      : [];

    const androidConfig = {
      channelId,
      badgeIconType: AndroidBadgeIconType.LARGE,
      importance: AndroidImportance.HIGH,
      visibility: AndroidVisibility.PUBLIC,
      smallIcon: 'ic_launcher',
      pressAction: {
        id: 'default',
      },
    };

    const officialAndroidConfig = androidImage
      ? {
          ...androidConfig,
          largeIcon: androidImage,
        }
      : androidConfig;

    // Display a notification
    await notifee.displayNotification({
      title,
      body,
      data,
      id,
      ios: {
        attachments,
      },
      android: officialAndroidConfig,
    });
  } catch (error) {}
};

const incrementBadgeCount = () => {
  try {
    notifee.incrementBadgeCount();
  } catch (error) {}
};

const decrementBadgeCount = () => {
  try {
    notifee.decrementBadgeCount();
  } catch (error) {}
};

const clearBadgeCount = () => {
  try {
    notifee.setBadgeCount(0);
  } catch (error) {}
};

const setBadgeCount = count => {
  try {
    const formattedCount = typeof count === 'number' ? count : Number(count);
    notifee.setBadgeCount(formattedCount >= 0 ? formattedCount : 0);
  } catch (error) {}
};

const requestNotificationPermission = async ({
  successCallback = () => {},
  failureCallback = () => {},
}) => {
  try {
    // only request notification on android version 33+
    // for android < 33, you do not need to request user permission
    if (SHOULD_REQUEST_NOTIFICATION_ANDROID) {
      //   const requestAndroidResult = await request(
      //     PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
      //   );
      //   if (requestAndroidResult === RESULTS.GRANTED) {
      //     successCallback?.();
      //     getFCMToken();
      //   } else {
      //     failureCallback?.();
      //   }
      //   return requestAndroidResult === RESULTS.GRANTED;
    }

    const notificationStatus = await messaging().requestPermission({
      provisional: false,
    });

    const isGranted =
      NOTIFICATION_APPROVED_STATUSES.includes(notificationStatus);

    if (isGranted) {
      successCallback?.();
      getFCMToken();
    } else {
      failureCallback?.();
    }
    return isGranted;
  } catch (error) {}
};

const requestNotificationProvisional = async () => {
  try {
    const notificationStatus = await messaging().requestPermission({
      provisional: true,
    });
    const isGranted =
      notificationStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (isGranted) {
      getFCMToken(true);
    }
  } catch (error) {}
};

const checkNotificationPermission = async () => {
  try {
    if (SHOULD_REQUEST_NOTIFICATION_ANDROID) {
      //   const android33AuthStatus = await check(
      //     PERMISSIONS.ANDROID.POST_NOTIFICATIONS,
      //   );
      //   return android33AuthStatus === RESULTS.GRANTED;
      return true;
    }

    const notificationStatus = await messaging().hasPermission();

    const isGranted =
      NOTIFICATION_APPROVED_STATUSES.includes(notificationStatus);

    return isGranted;
  } catch (error) {}
};

const getFCMToken = async (isProvisional = false) => {
  try {
    if (!IS_ANDROID) {
      const isRegisteredRemote =
        messaging().isDeviceRegisteredForRemoteMessages;
      if (!isRegisteredRemote) {
        await messaging().registerDeviceForRemoteMessages();
      }
    }

    if (!isProvisional) {
    }

    const token = await messaging().getToken();
  } catch (error) {}
};

const deleteFCMToken = async () => {
  try {
    await messaging().deleteToken();
  } catch (error) {}
};

const checkNotificationOnActiveState = async (callback = () => {}) => {
  try {
    const isGranted = await checkNotificationPermission();

    const isAndroidBelow33Granted =
      !SHOULD_REQUEST_NOTIFICATION_ANDROID && isGranted;

    const isGrantedOnIOSAndAndroid33 = isGranted;

    if (isAndroidBelow33Granted || isGrantedOnIOSAndAndroid33) {
      getFCMToken();
    }

    if (isGranted) {
    }

    callback?.(isGranted);
  } catch (error) {}
};

const useNotification = ({successCallback, failureCallback} = {}) => {
  // check on active state
  //   useAppState({
  //     onActiveCallback: async () => {
  //       await checkNotificationOnActiveState(granted => {
  //         if (granted) {
  //         }
  //       });
  //     },
  //   });

  // request provisional IOS
  useEffect(() => {
    if (!IS_ANDROID) {
      requestNotificationProvisional();
    }
  }, []);

  // check status first for android below 33
  useEffect(() => {
    if (!SHOULD_REQUEST_NOTIFICATION_ANDROID) {
      checkNotificationOnActiveState(granted => {
        if (granted) {
        }
      });
    }
  }, []);

  // message arrived
  useEffect(() => {
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      const {messageId, data, notification} = remoteMessage;
      const {title, body, android} = notification || {};

      await displayNotification({
        id: messageId,
        title,
        body,
        data,
        androidImage: android?.imageUrl,
      });
    });

    return unsubscribe;
  }, []);

  // android background state and quit state
  useEffect(() => {
    // open notification from background state
    messaging().onNotificationOpenedApp(remoteMessage => {
      androidPressNotificationHandler(remoteMessage);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          androidPressNotificationHandler(remoteMessage, true);
        }
      });
  }, []);

  // onTokenRefresh
  useEffect(() => {
    messaging().onTokenRefresh(async token => {});
  }, []);

  // Subscribe to events
  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(async ({type, detail}) => {
      const {notification} = detail;
      const {data, title} = notification || {};

      switch (type) {
        case EventType.DISMISSED:
          if (notification?.id) {
            await notifee.cancelNotification(notification?.id);
          }
          break;
        case EventType.PRESS:
          // ios foreground/background/killapp press

          break;
        case EventType.DELIVERED:
          break;
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const toggleNotificationPermission = async () => {
    try {
      if (!SHOULD_REQUEST_NOTIFICATION_ANDROID && IS_ANDROID) {
        // openSettings();
        return;
      }

      const isGranted = await checkNotificationPermission();

      if (isGranted) {
        // openSettings();
        return;
      }

      const requestGranted = await requestNotificationPermission({
        successCallback: () => {
          successCallback?.();
        },
        failureCallback: () => {
          failureCallback?.();
        },
      });

      if (!requestGranted) {
        // openSettings();
      }
    } catch (error) {}
  };

  return {
    toggleNotificationPermission,
  };
};

export {
  checkNotificationPermission,
  clearBadgeCount,
  decrementBadgeCount,
  deleteFCMToken,
  displayNotification,
  getFCMToken,
  incrementBadgeCount,
  requestNotificationPermission,
  setBadgeCount,
  useNotification,
};
