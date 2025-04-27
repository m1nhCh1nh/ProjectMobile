import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import axios from 'axios';
import { SharedElement } from 'react-navigation-shared-element';

// Định nghĩa kiểu Photo khớp với API
interface Photo {
  _id: string;
  imageUrl: string;
  description: string;
  keywords: string[];
  user: {
    _id: string;  // API trả về "_id"
    name: string;
    email: string;
  };
  likes: number;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

// Định nghĩa kiểu RootStackParamList
type RootStackParamList = {
  Home: undefined;
  PhotoDetail: { photo: Photo };
  UserProfile: { user: { _id: string; name: string; email: string } };
};

// Định nghĩa kiểu props cho PhotoDetailScreen
type PhotoDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'PhotoDetail'>;

// Extend component type to include sharedElements
type SharedElementScreenComponent<P> = React.FC<P> & {
  sharedElements?: (route: any) => string[];
};

const PhotoDetailScreen: SharedElementScreenComponent<PhotoDetailScreenProps> = ({ route, navigation }) => {
  const { photo } = route.params;
  // Normalized photo ID for API calls
  const photoId = photo._id ?? (photo as any).id;

  // useEffect(() => {
  //   console.log('User ID:', photo.user._id);
  // }, [photo.user._id]);

  // State for original image dimensions
  const [imgSize, setImgSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const screenWidth = Dimensions.get('window').width;
  useEffect(() => {
    Image.getSize(photo.imageUrl,
      (width, height) => setImgSize({ width, height }),
      (error) => console.error('Image.getSize error:', error)
    );
  }, [photo.imageUrl]);

  // Like count state
  const [likes, setLikes] = useState(photo.likes);
  // Like handler
  const handleLike = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        Alert.alert('Error', 'Bạn cần đăng nhập để thực hiện thao tác này');
        return;
      }
      
      // Using PUT method as specified by the API
      const response = await axios.put(`${API_URL}/v1/photos/${photoId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Like response:', response.data);
      
      // Update the like count with the new value from the response
      if (response.data && (response.data.likes !== undefined || 
          (response.data.photo && response.data.photo.likes !== undefined))) {
        const newLikes = response.data.likes ?? response.data.photo?.likes;
        setLikes(newLikes);
      }
    } catch (err: any) {
      console.error('Like error:', err);
      
      // More detailed error handling
      if (err.response) {
        console.error('Error response:', err.response.status, err.response.data);
      }
      
      Alert.alert('Error', err.message || 'Có lỗi xảy ra khi like ảnh');
    }
  };

  // State for fetched detail
  const [photoData, setPhotoData] = useState<Photo | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(true);

  // Fetch full detail to get user._id
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/v1/photos/${photoId}`, {
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Không thể lấy chi tiết ảnh');
        const data = await res.json();
        setPhotoData(data.user ? data : data.photo || data);
      } catch (err) {
        console.error('Fetch photo detail error:', err);
      } finally {
        setLoadingDetail(false);
      }
    })();
  }, [photoId]);

  // Sync likes state when detailed photo loads
  useEffect(() => {
    if (photoData) {
      setLikes(photoData.likes);
    }
  }, [photoData]);

  // Use fetched detail or fallback to route param
  const currentPhoto = photoData || photo;

  const [isChangingVisibility, setIsChangingVisibility] = useState(false);

  // Toggle visibility locally; API call moved to ProfileScreen
  const togglePhotoVisibility = () => {
    setPhotoData(prev => prev ? { ...prev, isPublic: !prev.isPublic } : null);
  };

  const isOwner = currentPhoto.user._id === photo.user._id;

  return (
    loadingDetail ? (
      <ActivityIndicator style={styles.container} />
    ) : (
      <SafeAreaView style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        <ScrollView bounces={false}>
          <View style={styles.imageContainer}>
            <TouchableOpacity onPress={() => Alert.alert('User Name', currentPhoto.user.name)} activeOpacity={0.8}>
              <SharedElement id={`photo.${photo._id}.image`}>
                <Image
                  source={{ uri: currentPhoto.imageUrl }}
                  style={
                    imgSize.width > 0 && imgSize.height > 0
                      ? { width: screenWidth, height: (screenWidth * imgSize.height) / imgSize.width }
                      : { width: screenWidth, height: screenWidth * 0.75 }
                  }
                  resizeMode="contain"
                />
              </SharedElement>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{currentPhoto.description}</Text>
            
            <TouchableOpacity
              style={styles.infoRow}
              onPress={() => {
                console.log('user:', currentPhoto.user);
                console.log('user._id:', currentPhoto.user._id);
                navigation.navigate('UserProfile', { user: currentPhoto.user });
              }}
            >
              <Ionicons name="person-outline" size={18} color="#555" />
              <Text style={styles.infoText}>{currentPhoto.user.name}</Text>
            </TouchableOpacity>
            
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={18} color="#555" />
              <Text style={styles.infoText}>
                {new Date(currentPhoto.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })}
              </Text>
            </View>
            
            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem} onPress={handleLike}>
                <Ionicons name="heart-outline" size={22} color="#ff3b30" />
                <Text style={styles.statText}>{likes}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Từ khóa</Text>
            <View style={styles.keywordsContainer}>
              {currentPhoto.keywords.map((keyword, index) => (
                <Text key={index} style={styles.keyword}>
                  #{keyword}
                </Text>
              ))}
            </View>
            
            <Text style={styles.sectionTitle}>Mô tả</Text>
            <Text style={styles.description}>{currentPhoto.description}</Text>

        
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  );
};

PhotoDetailScreen.sharedElements = (route) => {
  const { photo } = route.params;
  return [`photo.${photo._id}.image`];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 15,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#555',
  },
  statsContainer: {
    flexDirection: 'row',
    marginTop: 5,
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  statText: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  keyword: {
    fontSize: 14,
    color: '#2196F3',
    marginRight: 8,
    marginBottom: 4,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  visibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  visibilityLabel: {
    fontSize: 16,
    color: '#555',
    marginRight: 8,
  },
  visibilityButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 4,
  },
  visibilityButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default PhotoDetailScreen;