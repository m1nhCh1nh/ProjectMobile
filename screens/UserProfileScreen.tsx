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
  Login: {}; // Add the Login screen to the type definition
};

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = route.params;
  const [loading, setLoading] = useState(false);

  const handleChatPress = async () => {
    try {
      setLoading(true);
      
      // Thêm key 'accessToken' vào danh sách kiểm tra
      let userToken = await AsyncStorage.getItem('accessToken');
      console.log("Token từ accessToken:", userToken ? "Tìm thấy" : "Không tìm thấy");
      
      // Kiểm tra các key khác nếu cần
      if (!userToken) {
        userToken = await AsyncStorage.getItem('token');
        console.log("Token từ token:", userToken ? "Tìm thấy" : "Không tìm thấy");
      }
      
      if (!userToken) {
        userToken = await AsyncStorage.getItem('userToken');
        console.log("Token từ userToken:", userToken ? "Tìm thấy" : "Không tìm thấy");
      }
      
      // Kiểm tra từ user object trong storage
      if (!userToken) {
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          try {
            const parsedUserData = JSON.parse(userData);
            console.log("Dữ liệu user:", parsedUserData);
            
            // Kiểm tra token trong user object
            if (parsedUserData.accessToken) {
              userToken = parsedUserData.accessToken;
              console.log("Tìm thấy token trong user.accessToken");
            } else if (parsedUserData.token) {
              userToken = parsedUserData.token;
              console.log("Tìm thấy token trong user.token");
            }
          } catch (e) {
            console.error("Lỗi khi parse user data:", e);
          }
        }
      }
      
      // Nếu vẫn không tìm được token
      if (!userToken) {
        console.log("Tất cả các phương thức lấy token đều thất bại");
        // Hiển thị cửa sổ đăng nhập...
        Alert.alert(
          'Lỗi xác thực',
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.',
          [
            {
              text: 'Đăng nhập',
              onPress: () => {
                // Điều hướng người dùng về màn hình đăng nhập
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }]
                });
              }
            }
          ]
        );
        setLoading(false);
        return;
      }
      
      // Kiểm tra token có giá trị hợp lệ
      if (typeof userToken !== 'string' || userToken.trim() === '') {
        throw new Error('Token không hợp lệ');
      }
      
      // Tiếp tục xử lý với token hợp lệ
      // Lấy user ID từ _id hoặc id
      const userId = user._id || user.id;
      console.log('User ID được sử dụng:', userId);
      
      let chatData;
      
      // Tạo cuộc trò chuyện với userId
      if (userId) {
        console.log('Tạo cuộc trò chuyện với userId:', userId);
        
        const response = await axios.post(
          `${API_URL}/v1/chats`,
          { participants: [userId] },
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            }
          }
        );
        
        chatData = response.data;
        console.log('Tạo cuộc trò chuyện thành công:', chatData);
      } else {
        throw new Error('Không tìm thấy userId hợp lệ');
      }
      
      // Thêm log trước khi chuyển hướng để debug
      console.log('Chuẩn bị chuyển đến Chat screen với dữ liệu:', {
        chatId: chatData._id || chatData.id,
        recipient: user.name,
        email: user.email,
        userId: userId
      });
      
      // Chuyển hướng đến màn hình Chat với đầy đủ tham số
      navigation.navigate('Chat', {
        chatId: chatData._id || chatData.id,
        recipient: user.name,
        email: user.email, 
        userId: userId
      });
      
    } catch (error) {
      console.error('Lỗi khi tạo cuộc trò chuyện:', error);
      
      let errorMessage = 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          // Token hết hạn hoặc không hợp lệ
          errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          
          // Xóa token không hợp lệ
          await AsyncStorage.removeItem('token');
          await AsyncStorage.removeItem('userToken');
          
          // Thêm nút đăng nhập lại
          Alert.alert(
            'Lỗi xác thực',
            errorMessage,
            [
              {
                text: 'Đăng nhập',
                onPress: () => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Login' }]
                  });
                }
              }
            ]
          );
          setLoading(false);
          return;
        } else if (error.response) {
          errorMessage = `Lỗi (${error.response.status}): ${error.response.data?.message || 'Vui lòng thử lại sau'}`;
        }
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