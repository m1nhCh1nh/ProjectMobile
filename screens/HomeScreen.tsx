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

      
  
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 0,
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
});

export default PhotoGallery;