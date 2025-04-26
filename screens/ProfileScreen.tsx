import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, SafeAreaView, StatusBar, Platform, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/apiService';
import axios from 'axios';
import { API_URL } from '../constants/config';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  
  const [profile, setProfile] = useState<{ name: string; username: string; id: string } | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [photos, setPhotos] = useState<Array<{ id: string; imageUrl: string; description?: string; isPublic?: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid', 'bookmark', or 'heart'
  const [likedPhotos, setLikedPhotos] = useState<Array<{ id: string; imageUrl: string; description?: string; isPublic?: boolean }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        // First check if we have valid authentication
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('No access token found');
          navigation.navigate('Login');
          return;
        }
        
        const userData = await AsyncStorage.getItem('user');
        if (!userData) {
          console.log('No user data found');
          navigation.navigate('Login');
          return;
        }
        
        const user = JSON.parse(userData);
        const userId = user._id ?? user.id;
        setProfile({ name: user.name, username: '@'+user.email.split('@')[0], id: userId });
        // Fetch user's photos
        fetchPhotos();
      } catch (err) {
        console.error('Error loading profile:', err);
        Alert.alert('Error', 'Could not load profile. Please login again.');
        navigation.navigate('Login');
      }
    };
    loadProfile();
  }, [navigation]);

  const fetchPhotos = async () => {
    try {
      setIsLoading(true);
      
      // Lấy token xác thực
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Sử dụng endpoint chính xác với pagination
      const response = await axios.get(`${API_URL}/v1/photos/my-photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          limit: 20 // Adjust based on your needs
        }
      });
      
      console.log('Photos response status:', response.status);
      console.log('Photos response data:', response.data);
      
      if (!response.data || !response.data.photos || !Array.isArray(response.data.photos)) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from server');
      }
      
      // Transform the data to match your expected format
      const transformedPhotos = response.data.photos.map((photo: { 
        _id: string;
        imageUrl: string;
        description?: string;
        isPublic?: boolean;
      }) => ({
        id: photo._id,  // Map MongoDB's _id to your expected id field
        imageUrl: photo.imageUrl,
        description: photo.description,
        isPublic: photo.isPublic
      }));
      
      setPhotos(transformedPhotos);
      setPostsCount(transformedPhotos.length); // Update post count
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      
      // Hiển thị thông tin lỗi chi tiết hơn
      if (error.response) {
        // Lỗi server trả về
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
          handleLogout();
          return;
        }
      }
      
      Alert.alert('Error', 'Could not load your photos. Please try again later.');
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Add this function after fetchPhotos
  const fetchLikedPhotos = async () => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Get all photos (will include public photos + own photos)
      const response = await axios.get(`${API_URL}/v1/photos`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params: {
          page: 1,
          limit: 50 // Higher limit to get more photos
        }
      });
      
      if (!response.data || !response.data.photos || !Array.isArray(response.data.photos)) {
        throw new Error('Invalid response format from server');
      }
      
      // Filter only photos that the current user has liked
      const liked = response.data.photos.filter((photo: {
        _id: string;
        imageUrl: string;
        description?: string;
        isPublic?: boolean;
        likedBy?: string[];
      }) => 
        photo.likedBy && profile && photo.likedBy.includes(profile.id)
      );
      
      const transformedPhotos = liked.map((photo: {
        _id: string;
        imageUrl: string;
        description?: string;
        isPublic?: boolean;
        likedBy?: string[];
      }) => ({
        id: photo._id,
        imageUrl: photo.imageUrl,
        description: photo.description,
        isPublic: photo.isPublic
      }));
      
      setLikedPhotos(transformedPhotos);
    } catch (error) {
      console.error('Error fetching liked photos:', error);
      Alert.alert('Error', 'Could not load your liked photos');
      setLikedPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Navigation already declared at the top

  const handleLogout = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      await api.delete(`/v1/users/logout`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  };

  const showSettingsMenu = () => {
    Alert.alert(
      'Settings',
      '',
      [
        { text: 'Profile Settings', onPress: () => {} },
        { text: 'Help & Support', onPress: () => {} },
        { text: 'Logout', style: 'destructive', onPress: handleLogout },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const toggleVisibility = async (id: string) => {
    try {
      const target = photos.find(p => p.id === id);
      if (!target) return;
      const res = await api.patch(`/v1/photos/${id}/visibility`, { isPublic: !target.isPublic });
      const updated = res.data.photo;
      setPhotos(prev => prev.map(p => p.id === id ? { ...p, isPublic: updated.isPublic } : p));
      Alert.alert('Success', 'Cập nhật quyền riêng tư thành công');
    } catch (err) {
      console.error('Toggle visibility error:', err);
      Alert.alert('Error', 'Không thể cập nhật quyền riêng tư');
    }
  };

  const handlePhotoLongPress = (photo: { id: string; isPublic?: boolean }) => {
    Alert.alert(
      'Photo Options',
      'What would you like to do with this photo?',
      [
        {
          text: photo.isPublic ? 'Make Private' : 'Make Public',
          onPress: () => toggleVisibility(photo.id)
        },
        {
          text: 'Delete Photo',
          style: 'destructive',
          onPress: () => {
            // Show confirmation dialog before deleting
            Alert.alert(
              'Confirm Delete',
              'Are you sure you want to delete this photo? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => deletePhoto(photo.id) }
              ]
            );
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ],
      { cancelable: true }
    );
  };

  const deletePhoto = async (id: string) => {
    try {
      setIsLoading(true);
      
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      // Call the delete API endpoint
      await axios.delete(`${API_URL}/v1/photos/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Remove the deleted photo from state
      setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== id));
      // Update posts count
      setPostsCount(prevCount => prevCount - 1);
      
      Alert.alert('Success', 'Photo deleted successfully');
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        if (error.response.status === 401) {
          Alert.alert('Authentication Error', 'Your session has expired. Please login again.');
          handleLogout();
          return;
        }
      }
      
      Alert.alert('Error', 'Could not delete the photo. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      // Skip if we're already loading or don't have a profile yet
      if (!isLoading && profile) {
        fetchPhotos();
      }
      
      return () => {
        // Cleanup if needed
      };
    }, [profile]) // Depend on profile to avoid unnecessary fetches
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPhotos().then(() => {
      setRefreshing(false);
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      
      <View style={styles.header}>
        <TouchableOpacity>
          <Ionicons name="menu-outline" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={showSettingsMenu}>
          <Ionicons name="settings-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading your photos...</Text>
        </View>
      ) : (
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2196F3']}
            tintColor={'#2196F3'}
          />
        }
      >
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>{profile?.name.charAt(0) ?? ''}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.name}</Text>
              <Text style={styles.profileUsername}>{profile?.username}</Text>
              <TouchableOpacity style={styles.editProfileButton}>
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{postsCount}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{followers}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{following}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'grid' && styles.activeTab]}
            onPress={() => setActiveTab('grid')}
          >
            <Ionicons name="grid-outline" size={22} color={activeTab === 'grid' ? "#2196F3" : "#999"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'bookmark' && styles.activeTab]}
            onPress={() => setActiveTab('bookmark')}
          >
            <Ionicons name="bookmark-outline" size={22} color={activeTab === 'bookmark' ? "#2196F3" : "#999"} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'heart' && styles.activeTab]}
            onPress={() => {
              setActiveTab('heart');
              fetchLikedPhotos(); // Fetch liked photos when tab is selected
            }}
          >
            <Ionicons name="heart-outline" size={22} color={activeTab === 'heart' ? "#2196F3" : "#999"} />
          </TouchableOpacity>
        </View>

        <View style={styles.photosGrid}>
          {activeTab === 'grid' && photos.map((photo) => (
            <TouchableOpacity 
              key={photo.id} 
              style={styles.photoItem}
              onLongPress={() => handlePhotoLongPress(photo)}
            >
              <View style={styles.photoCard}>
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoDescription}>{photo.description}</Text>
                  
                  {/* Toggle visibility badge */}
                  <TouchableOpacity onPress={() => toggleVisibility(photo.id)}>
                    <View style={[
                      styles.visibilityBadge,
                      photo.isPublic ? styles.publicBadge : styles.privateBadge
                    ]}>
                      <Text style={styles.visibilityText}>
                        {photo.isPublic ? 'Public' : 'Private'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {activeTab === 'heart' && likedPhotos.map((photo) => (
            <TouchableOpacity 
              key={photo.id} 
              style={styles.photoItem}
              onPress={() => navigation.navigate('PhotoDetail', { photo: {
                _id: photo.id,
                imageUrl: photo.imageUrl,
                description: photo.description,
                isPublic: photo.isPublic
              }})}
            >
              <View style={styles.photoCard}>
                <Image
                  source={{ uri: photo.imageUrl }}
                  style={styles.photoImage}
                  resizeMode="cover"
                />
                <View style={styles.photoInfo}>
                  <Text style={styles.photoDescription}>{photo.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          
          {activeTab === 'bookmark' && (
            <View style={styles.emptyStateContainer}>
              <Ionicons name="bookmark" size={48} color="#ccc" />
              <Text style={styles.emptyStateText}>No bookmarked photos yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 10 : 0,
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 60, 
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  editProfileButton: {
    backgroundColor: '#f5f5f5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  editProfileText: {
    fontWeight: '500',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#eee',
  },
  tabContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  photoItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 1,
  },
  photoCard: {
    flex: 1,
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f1f1f1',
  },
  photoInfo: {
    padding: 8,
  },
  photoDescription: {
    fontSize: 14,
    color: '#333',
  },
  visibilityBadge: {
    marginTop: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  publicBadge: {
    backgroundColor: '#4CAF50',
  },
  privateBadge: {
    backgroundColor: '#F44336',
  },
  visibilityText: {
    fontSize: 12,
    color: '#fff',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
    width: '100%',
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
});

export default ProfileScreen;