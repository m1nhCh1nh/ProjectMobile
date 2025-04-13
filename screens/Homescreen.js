import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

const PhotoGallery = () => {
  // Dữ liệu ảnh mẫu
  const photos = [
    { id: 1, title: 'Beautiful sunset at the beach', image: require('../assets/images/pexels-photo-9944662.jpeg') },
    { id: 2, title: 'Mountain hiking adventure', image: 'https://via.placeholder.com/400' },
    { id: 3, title: 'City lights at night', image: 'https://via.placeholder.com/400' },
    { id: 4, title: 'Forest exploration', image: 'https://via.placeholder.com/400' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Photo Gallery</Text>
      </View>

     
      <ScrollView style={styles.scrollView}>
        <View style={styles.galleryGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image
                source={typeof photo.image === 'string' ? { uri: photo.image } : photo.image}
                style={styles.photoImage}
                resizeMode="cover"
              />
              <View style={styles.photoTitleContainer}>
                <Text style={styles.photoTitle}>{photo.title}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Feather name="home" size={24} color="#3498db" />
          <Text style={[styles.navText, styles.activeNavText]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Feather name="search" size={24} color="#999" />
          <Text style={styles.navText}>Search</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.addButton}>
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Feather name="message-circle" size={24} color="#999" />
          <Text style={styles.navText}>Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Feather name="user" size={24} color="#999" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
    
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#273c75',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  galleryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
  },
  photoCard: {
    width: '50%',
    padding: 5,
    marginBottom: 10,
  },
  photoImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    backgroundColor: '#f1f1f1',
  },
  photoTitleContainer: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginTop: -15,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  photoTitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 60,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 3,
    color: '#999',
  },
  activeNavText: {
    color: '#3498db',
  },
  addButton: {
    backgroundColor: '#3498db',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
});

export default PhotoGallery;