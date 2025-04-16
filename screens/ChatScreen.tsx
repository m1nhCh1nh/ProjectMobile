import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ChatScreen = () => {
  
  const messages = [
    { id: 1, sender: 'John Doe', message: 'Hello, how are you?', time: '10:30 AM' },
    { id: 2, sender: 'Jane Smith', message: 'Can you share that photo?', time: '09:15 AM' },
    { id: 3, sender: 'Mike Johnson', message: 'Nice photos from your trip!', time: 'Yesterday' },
    { id: 4, sender: 'Sarah Wilson', message: 'Are you free this weekend?', time: 'Yesterday' },
    { id: 5, sender: 'Alex Brown', message: 'Check out my new gallery', time: 'Monday' },
  ];

  const renderMessageItem = ({ item }) => (
    <TouchableOpacity style={styles.messageItem}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.sender.charAt(0)}</Text>
      </View>
      <View style={styles.messageContent}>
        <Text style={styles.senderName}>{item.sender}</Text>
        <Text style={styles.messageText}>{item.message}</Text>
      </View>
      <Text style={styles.messageTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
    
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>A</Text>
          </View>
          <Ionicons name="chevron-down" size={16} color="#333" />
        </TouchableOpacity>
      </View>

    
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.flatListContent}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
   
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  profileAvatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  flatListContent: {
    paddingBottom: 60, 
  },
  messageItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#555',
  },
  messageContent: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  messageText: {
    color: '#666',
  },
  messageTime: {
    color: '#999',
    fontSize: 12,
  },
});

export default ChatScreen;