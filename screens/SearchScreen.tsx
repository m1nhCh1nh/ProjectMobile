import React from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SearchScreen = () => {

  const searchResults = [
    { id: 1, title: 'Beach sunset', image: 'https://via.placeholder.com/300' },
    { id: 2, title: 'Mountain view', image: 'https://via.placeholder.com/300' },
    { id: 3, title: 'City skyline', image: 'https://via.placeholder.com/300' },
    { id: 4, title: 'Nature trail', image: 'https://via.placeholder.com/300' },
    { id: 5, title: 'Lake reflection', image: 'https://via.placeholder.com/300' },
  ];

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity style={styles.searchResultItem}>
      <Image
        source={{ uri: item.image }}
        style={styles.searchResultImage}
        resizeMode="cover"
      />
      <Text style={styles.searchResultTitle}>{item.title}</Text>
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
        <TouchableOpacity style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Search Photos</Text>
        <TouchableOpacity style={styles.searchIconButton}>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by description..."
          placeholderTextColor="#999"
        />
      </View>

      
      <FlatList
        data={searchResults}
        renderItem={renderSearchItem}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  searchIconButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  flatListContent: {
    paddingBottom: 60, 
  },
  searchResultItem: {
    margin: 16,
    marginBottom: 0,
  },
  searchResultImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f1f1f1',
  },
  searchResultTitle: {
    marginTop: 8,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SearchScreen;