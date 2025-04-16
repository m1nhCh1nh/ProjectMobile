import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const UploadScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
     
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

     
      <View style={styles.header}>
        <Text style={styles.headerTitle}>App</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="cloud-outline" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="grid-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.uploadButton}>
          <Text style={styles.uploadButtonText}>Upload</Text>
        </TouchableOpacity>
      </View>

      
      <View style={styles.photoSelectContainer}>
        <View style={styles.photoPlaceholder}>
          <Ionicons name="image-outline" size={40} color="#999" />
          <Ionicons name="add-outline" size={20} color="#999" style={styles.addIcon} />
          <Text style={styles.photoPlaceholderText}>Tap to select a photo</Text>
        </View>

        <TextInput
          style={styles.descriptionInput}
          placeholder="Add a description..."
          placeholderTextColor="#999"
        />

        <TouchableOpacity style={styles.choosePhotoButton}>
          <Text style={styles.choosePhotoButtonText}>Choose Photo</Text>
        </TouchableOpacity>
      </View>

      
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    marginHorizontal: 8,
  },
  uploadButton: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#333',
  },
  photoSelectContainer: {
    flex: 1,
    padding: 16,
    paddingBottom: 76,
  },
  photoPlaceholder: {
    width: '100%',
    height: 250,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  addIcon: {
    position: 'absolute',
    top: '50%',
    right: '50%',
    marginRight: -30,
    marginTop: -30,
  },
  photoPlaceholderText: {
    marginTop: 12,
    color: '#999',
    fontSize: 16,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  choosePhotoButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  choosePhotoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default UploadScreen;