// screens/UserProfileScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';

type RootStackParamList = {
  UserProfile: { user: { name: string; email: string; _id?: string; id?: string } };
  Chat: { 
    recipient?: string; 
    email?: string; 
    userId?: string;
    chatId?: string;
    user?: { name: string; email: string; _id?: string; id?: string }
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = route.params;
  const [loading, setLoading] = useState(false);

  const handleChatPress = async () => {
    // Log user information to make sure we have the data
    console.log('Thông tin người dùng nhận được:', JSON.stringify(user));
    console.log('Thuộc tính của user:', Object.keys(user));
    
    // Check if we have a valid email and ID
    if (!user.email || user.email.trim() === '') {
      Alert.alert('Lỗi', 'Không thể chat với người dùng này. Email không hợp lệ.');
      return;
    }
    
    // Get user ID either from _id or id field
    const userId = user._id || user.id;
    
    // Thêm dòng code in ra userId
    console.log('User ID được sử dụng:', userId);

    try {
      setLoading(true);
      
      // Get user token from AsyncStorage
      const userToken = await AsyncStorage.getItem('token');
      
      if (!userToken) {
        Alert.alert('Lỗi', 'Bạn cần đăng nhập để sử dụng tính năng chat');
        setLoading(false);
        return;
      }
      
      let chatData;
      
      // Nếu có userId, sử dụng nó để tạo chat
      if (userId) {
        console.log('Tạo cuộc trò chuyện với userId:', userId);
        
        // Gọi API để tạo chat với userId
        const response = await axios.post(
          `${API_URL}/v1/chats`,
          { participants: [user._id] },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            }
          }
        );
        
        chatData = response.data;
        console.log('Tạo cuộc trò chuyện thành công:', chatData);
      } 
      // Nếu không có userId, tìm user dựa trên email
      else {
        console.log('Tìm kiếm người dùng với email:', user.email);
        
        // Gọi API để tìm kiếm người dùng theo email
        const userResponse = await axios.get(
          `${API_URL}/v1/users`,
          {
            headers: {
              'Authorization': `Bearer ${userToken}`
            },
            params: {
              email: user.email
            }
          }
        );
        
        // Tìm người dùng với email trùng khớp
        let foundUser = null;
        
        if (Array.isArray(userResponse.data)) {
          foundUser = userResponse.data.find(u => u.email === user.email);
        } else if (userResponse.data && userResponse.data.email === user.email) {
          foundUser = userResponse.data;
        }
        
        if (!foundUser) {
          throw new Error('Không tìm thấy người dùng với email này');
        }
        
        const foundUserId = foundUser._id;
        console.log('Tìm thấy người dùng với ID:', foundUserId);
        
        // Tạo cuộc trò chuyện với userId đã tìm thấy
        const chatResponse = await axios.post(
          `${API_URL}/v1/chats`,
          { participants: [foundUserId] },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            }
          }
        );
        
        chatData = chatResponse.data;
        console.log('Tạo cuộc trò chuyện thành công:', chatData);
      }
      
      // Điều hướng đến màn hình Chat với thông tin cần thiết
      navigation.navigate('Chat', { 
        user,
        chatId: chatData._id,
        recipient: user.name,
        email: user.email,
        userId: userId || chatData.participants.find((p: string | undefined) => p !== user._id)?._id
      });
      
    } catch (error) {
      console.error('Lỗi khi tạo cuộc trò chuyện:', error);
      
      let errorMessage = 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.';
      
      if (axios.isAxiosError(error) && error.response) {
        errorMessage = `Lỗi (${error.response.status}): ${error.response.data?.message || 'Vui lòng thử lại sau'}`;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      Alert.alert('Lỗi', errorMessage);
      
    } finally {
      setLoading(false);
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thông tin người dùng</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.label}>Tên</Text>
            <Text style={styles.value}>{user.name}</Text>

            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user.email}</Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.chatButton}
          onPress={handleChatPress}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              <Text style={styles.chatButtonText}>Nhắn tin</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
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
  content: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
    marginTop: 2,
  },
  chatButton: {
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    marginTop: 16,
    gap: 8,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UserProfileScreen;