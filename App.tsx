import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './navigation/bottomTabs';
import LoginScreen from './screens/LoginScreen';
import SignupScreen from './screens/SignupScreen';
import HomeScreen from './screens/HomeScreen';
import PhotoDetailScreen from './screens/PhotoDetailScreen';
import UploadScreen from './screens/UploadScreen';
import SearchScreen from './screens/SearchScreen';
import ChatScreen from './screens/ChatScreen';
import ProfileScreen from './screens/ProfileScreen';

// Định nghĩa kiểu Photo cho PhotoDetail
interface Photo {
  id: string;
  imageUrl: string;
  description: string;
  keywords: string[];
  user: {
    name: string;
    email: string;
  };
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa kiểu cho Stack Navigator
type RootStackParamList = {
  Login: undefined;
  Signup: undefined;
  Main: undefined;
  Home: undefined;
  PhotoDetail: { photo: Photo };
  Search: undefined;
  Add: undefined;
  Chat: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Main" // Khởi động trực tiếp vào BottomTabs để test HomeScreen
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Main" component={BottomTabs} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="PhotoDetail" component={PhotoDetailScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Add" component={UploadScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}