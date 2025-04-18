import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, Platform, Alert, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios, { AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';

const UploadScreen = ({ navigation }: { navigation: any }) => {
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [description, setDescription] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to access your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        // TODO: Update to MediaType when upgrading expo-image-picker
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false, // Tắt tính năng chỉnh sửa để giữ ảnh nguyên bản
        // aspect: [4, 3], // Bỏ tỷ lệ cố định để giữ nguyên tỷ lệ ảnh gốc
        quality: 1.0, // Giữ chất lượng tối đa
        exif: true, // Giữ lại metadata EXIF nếu cần
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleUpload = async () => {
    if (!image) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please add a description');
      return;
    }

    setIsLoading(true);
    setUploadProgress(0);

    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Authentication Error', 'You need to be logged in to upload photos');
        navigation.navigate('Login');
        return;
      }
      
      // Get file information
      const fileInfo = {
        uri: image.uri,
        type: image.type || 'image/jpeg', // Use image.type if available
        name: image.fileName || `photo_${new Date().getTime()}.jpg`, // Use a timestamp if fileName not available
      };
      
      // Create form data with optimized entries
      const formData = new FormData();
      formData.append('image', fileInfo as any);
      formData.append('description', description);
      if (keywords) {
        formData.append('keywords', keywords);
      }

      // Get the correct API URL 
      const apiUrl = `${API_URL || 'http://192.168.101.237:3000'}/v1/photos/upload`;

      // Create a cancellation token for potential cancel operation
      const cancelTokenSource = axios.CancelToken.source();
      
      // Set a shorter timeout for faster failure detection
      const response = await axios.post(
        apiUrl,
        formData,
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`,
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded || 1)
            );
            setUploadProgress(percentCompleted);
          },
          timeout: 20000, // Reduced timeout to 20 seconds for faster failure detection
          cancelToken: cancelTokenSource.token, // Allow for upload cancellation
        }
      );

      Alert.alert(
        'Success',
        'Photo uploaded successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setImage(null);
              setDescription('');
              setKeywords('');
              setUploadProgress(0);
              navigation.navigate('Profile'); 
            },
          },
        ]
      );
    } catch (error) {
      console.error('Upload error:', error);
      
      // More detailed error handling
      if (axios.isAxiosError(error)) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response) {
          console.error('Response error data:', error.response.data);
          console.error('Response error status:', error.response.status);
          
          let errorMessage = 'Server error: ';
          if (error.response.status === 401) {
            errorMessage = 'Authentication failed. Please login again.';
            AsyncStorage.removeItem('token');
            navigation.navigate('Login');
          } else if (error.response.status === 413) {
            errorMessage = 'Image file is too large. Please select a smaller image.';
          } else if (error.response.data && error.response.data.message) {
            errorMessage = error.response.data.message;
          } else {
            errorMessage += `Status code ${error.response.status}`;
          }
          
          Alert.alert('Upload Failed', errorMessage);
        } else if (error.request) {
          // The request was made but no response was received
          Alert.alert(
            'Network Error',
            'Could not connect to the server. Please check your internet connection.'
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          Alert.alert('Error', 'An unexpected error occurred while uploading. Please try again.');
        }
      }
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Upload Photo</Text>
        <TouchableOpacity 
          style={[styles.uploadButton, (!image || !description || isLoading) && styles.disabledButton]}
          onPress={handleUpload}
          disabled={!image || !description || isLoading}
        >
          <Text style={styles.uploadButtonText}>
            {isLoading ? 'Uploading...' : 'Upload'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.photoSelectContainer}>
        <TouchableOpacity 
          style={styles.photoPlaceholder}
          onPress={pickImage}
          disabled={isLoading}
        >
          {image ? (
            <>
              <Image 
                source={{ uri: image.uri }} 
                style={styles.selectedImage}
              />
              {isLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#2196F3" />
                  {uploadProgress > 0 && (
                    <Text style={styles.progressText}>{uploadProgress}%</Text>
                  )}
                </View>
              )}
            </>
          ) : (
            <>
              <Ionicons name="image-outline" size={40} color="#999" />
              <Ionicons name="add-outline" size={20} color="#999" style={styles.addIcon} />
              <Text style={styles.photoPlaceholderText}>Tap to select a photo</Text>
            </>
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.descriptionInput}
          placeholder="Add a description..."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          editable={!isLoading}
        />

        <TextInput
          style={styles.descriptionInput}
          placeholder="Add keywords (comma separated)..."
          placeholderTextColor="#999"
          value={keywords}
          onChangeText={setKeywords}
          editable={!isLoading}
        />
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
  uploadButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '500',
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
    overflow: 'hidden',
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
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    opacity: 0.7,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  progressText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    fontWeight: 'bold',
  },
});

export default UploadScreen;