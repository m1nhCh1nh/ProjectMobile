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
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/config';
import UserProfileScreen from './UserProfileScreen';

// Định nghĩa kiểu Photo khớp với API
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

// Định nghĩa kiểu RootStackParamList
type RootStackParamList = {
  Home: undefined;
  PhotoDetail: { photo: Photo };
  UserProfile: { user: { name: string; email: string } };
};

// Định nghĩa kiểu props cho PhotoDetailScreen
type PhotoDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'PhotoDetail'>;

const PhotoDetailScreen: React.FC<PhotoDetailScreenProps> = ({ route, navigation }) => {
  const { photo } = route.params;

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
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Bạn cần đăng nhập để thực hiện thao tác này');
        return;
      }
      const res = await fetch(`${API_URL}/v1/photos/${photo.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Thao tác like không thành công');
      setLikes(prev => prev + 1);
    } catch (err: any) {
      console.error('Like error:', err);
      Alert.alert('Error', err.message || 'Có lỗi xảy ra khi like ảnh');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <ScrollView bounces={false}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: photo.imageUrl }}
            style={
              imgSize.width > 0 && imgSize.height > 0
                ? { width: screenWidth, height: (screenWidth * imgSize.height) / imgSize.width }
                : { width: screenWidth, height: screenWidth * 0.75 }
            }
            resizeMode="contain"
          />
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{photo.description}</Text>
          
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => navigation.navigate('UserProfile', { user: photo.user })}
          >
            <Ionicons name="person-outline" size={18} color="#555" />
            <Text style={styles.infoText}>{photo.user.name}</Text>
          </TouchableOpacity>
          
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color="#555" />
            <Text style={styles.infoText}>
              {new Date(photo.createdAt).toLocaleDateString('vi-VN', {
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
            {photo.keywords.map((keyword, index) => (
              <Text key={index} style={styles.keyword}>
                #{keyword}
              </Text>
            ))}
          </View>
          
          <Text style={styles.sectionTitle}>Mô tả</Text>
          <Text style={styles.description}>{photo.description}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
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
});

export default PhotoDetailScreen;