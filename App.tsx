/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
import React from 'react';
import {Button, SafeAreaView, StyleSheet} from 'react-native';
import {useNotification} from './src/hooks/useNotification';

function App() {
  const {toggleNotificationPermission} = useNotification();
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: 'red'}}>
      <Button title="Toggle" onPress={toggleNotificationPermission} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
});

export default App;
