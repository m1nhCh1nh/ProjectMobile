import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import BottomTabs from './navigation/bottomTabs';

export default function App() {
  return (
    <NavigationContainer>
      <BottomTabs />
    </NavigationContainer>
  );
}
