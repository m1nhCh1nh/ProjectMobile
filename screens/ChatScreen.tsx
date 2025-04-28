import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { API_URL } from '../constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import socketService from '../services/socketService';

// Define message type theo mô hình dữ liệu từ tài liệu
type Message = {
  _id: string;
  text: string;
  sender: string | { _id?: string; id?: string; };
  chat: string;
  createdAt: string;
  readBy: string[];
};

// Define chat type theo mô hình dữ liệu từ tài liệu
type Chat = {
  _id: string;
  participants: string[];
  lastMessage?: string;
  createdAt: string;
  updatedAt: string;
};

// Định nghĩa kiểu User khớp với dữ liệu nhận được
type User = {
  name: string;
  email: string;
  _id?: string;
  id?: string;
};

type RootStackParamList = {
  Chat: { 
    recipient?: string; 
    email?: string; 
    userId?: string; 
    chatId?: string;
    user?: User; // Thêm user object để xử lý TH nhận được thông tin người dùng dạng object
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  // Ensure params exist, navigate back if missing
  useEffect(() => {
    if (!route.params) {
      navigation.goBack();
    }
  }, [route.params, navigation]);

  if (!route.params) {
    return null;
  }
  
  // Xử lý cả trường hợp nhận được thông tin người dùng dạng object và trường hợp nhận từng field riêng
  let recipient: string, email: string, userId: string | undefined, existingChatId = route.params.chatId;
  
  if (route.params.user) {
    // Trường hợp nhận được thông tin người dùng dạng object
    const user = route.params.user;
    recipient = user.name;
    email = user.email;
    userId = user._id || user.id;
    
    console.log('Received user info as object:', user);
  } else {
    // Trường hợp nhận từng field riêng lẻ
    recipient = route.params.recipient || '';
    email = route.params.email || '';
    userId = route.params.userId;
    
    console.log('Received user info as separate fields:', { recipient, email, userId });
  }
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Initialize chat conversation
  useEffect(() => {
    fetchCurrentUserId();
    
    // Nếu đã có chatId, sử dụng nó, ngược lại tạo chat mới
    if (existingChatId) {
      setChat({ _id: existingChatId } as Chat);
      fetchMessages(existingChatId);
    } else {
      createOrGetChat();
    }
    
    // Connect to socket
    setupSocketListeners();
    
    // Clean up socket connection when component unmounts
    return () => {
      if (chat?._id) {
        socketService.leaveChat(chat._id);
      }
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Remove socket listeners
      removeSocketListeners();
    };
  }, []);

  // Connect to socket khi chat được khởi tạo
  useEffect(() => {
    if (chat?._id) {
      // Kết nối và tham gia phòng chat
      if (!socketService.isConnected()) {
        socketService.connect().then(() => {
          socketService.joinChat(chat._id);
        });
      } else {
        socketService.joinChat(chat._id);
      }
    }
  }, [chat?._id]);

  // Thiết lập socket listeners
  const setupSocketListeners = () => {
    // Lắng nghe tin nhắn mới
    socketService.onMessage((newMessage) => {
      console.log('New message received:', newMessage);
      setMessages(prevMessages => [newMessage, ...prevMessages]);
    });
    
    // Lắng nghe sự kiện typing
    socketService.onTyping((data) => {
      if (data.user !== currentUserId) {
        setIsTyping(true);
      }
    });
    
    socketService.onStopTyping((data) => {
      if (data.user !== currentUserId) {
        setIsTyping(false);
      }
    });
    
    // Lắng nghe lỗi kết nối
    socketService.onError((err) => {
      console.error('Socket error:', err);
      setError('Không thể kết nối đến máy chủ chat. Vui lòng thử lại sau.');
    });
  };
  
  // Xóa socket listeners
  const removeSocketListeners = () => {
    // Thiết lập lại handlers rỗng để hủy các listeners
    socketService.onMessage(() => {});
    socketService.onTyping(() => {});
    socketService.onStopTyping(() => {});
    socketService.onError(() => {});
  };

  // Cải thiện hàm fetchCurrentUserId để lấy đúng ID người dùng hiện tại
  const fetchCurrentUserId = async () => {
    try {
      // Bước 1: Thử lấy trực tiếp từ AsyncStorage
      const userJson = await AsyncStorage.getItem('user');
      
      if (userJson) {
        try {
          const userData = JSON.parse(userJson);
          console.log('User data from AsyncStorage:', userData);
          
          // Kiểm tra cả hai trường ID phổ biến
          if (userData._id || userData.id) {
            const userId = userData._id || userData.id;
            console.log('Found user ID:', userId);
            setCurrentUserId(String(userId));
            return;
          }
        } catch (err) {
          console.warn('Error parsing user data:', err);
        }
      }
      
      // Bước 2: Thử các key khác
      const possibleUserKeys = ['userData', 'userInfo', 'currentUser'];
      
      for (const key of possibleUserKeys) {
        const storedData = await AsyncStorage.getItem(key);
        if (storedData) {
          try {
            const parsedData = JSON.parse(storedData);
            if (parsedData._id || parsedData.id) {
              const userId = parsedData._id || parsedData.id;
              console.log(`Found user ID in ${key}:`, userId);
              setCurrentUserId(String(userId));
              return;
            }
          } catch (e) {
            console.warn(`Error parsing ${key}:`, e);
          }
        }
      }
      
      // Bước 3: Thử lấy từ token
      const accessToken = await AsyncStorage.getItem('accessToken');
      if (accessToken) {
        // Check if we can extract ID from token
        try {
          const decoded = decodeJWT(accessToken);
          console.log('Decoded token:', decoded);
          if (decoded && (decoded.id || decoded._id || decoded.sub)) {
            const tokenUserId = decoded.id || decoded._id || decoded.sub;
            console.log('User ID from token:', tokenUserId);
            setCurrentUserId(String(tokenUserId));
            return;
          }
        } catch (e) {
          console.warn('Error decoding token:', e);
        }
      }
      
      console.error('Could not find user ID in AsyncStorage');
    } catch (err) {
      console.error('Error in fetchCurrentUserId:', err);
    }
  };

  // Helper function to decode JWT
  const decodeJWT = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error decoding JWT:', e);
      return null;
    }
  };

  // Create hoặc get existing chat theo API tài liệu
  const createOrGetChat = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user token from AsyncStorage
      const userToken = await AsyncStorage.getItem('accessToken');
      
      if (!userToken) {
        throw new Error('Bạn cần đăng nhập để sử dụng tính năng chat');
      }
      
      // Get current user ID for participants
      const storedUser = await AsyncStorage.getItem('user');
      const currentUser = storedUser ? JSON.parse(storedUser) : null;
      const currentUserIdLocal = currentUser?._id;
      
      // Check if we have either userId or email
      if ((!userId || userId.trim() === '') && (!email || email.trim() === '')) {
        console.error('Invalid userId and email:', { userId, email });
        setError('Không thể xác định người dùng. Vui lòng thử lại sau.');
        setLoading(false);
        return;
      }
      
      
      if (userId && userId.trim() !== '') {
        console.log('Creating chat with userId:', userId);
        
        
        const res = await fetch(`${API_URL}/v1/chats`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({ participants: [currentUserIdLocal, userId] })
        });
        
        if (!res.ok) throw new Error(`API error (${res.status})`);
        const chatData = await res.json();
        setChat(chatData);
        
        
        fetchMessages(chatData._id);
      } 
      // Otherwise use email to find the user first
      else if (email && email.trim() !== '') {
        console.log('Finding user with email:', email);
        
        try {
          
          
          const resUser = await fetch(`${API_URL}/v1/users?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${userToken}` }
          });
          
          if (!resUser.ok) throw new Error(`API error (${resUser.status})`);
          const usersList = await resUser.json();
          let foundUser = null;
          
          if (Array.isArray(usersList)) {
            // Nếu API trả về mảng, tìm user có email phù hợp
            foundUser = usersList.find(user => user.email === email);
          } else if (usersList && usersList.email === email) {
            // Nếu API trả về một user trực tiếp
            foundUser = usersList;
          }
          
          if (!foundUser) {
            throw new Error('Không tìm thấy người dùng với email này');
          }
          
          const foundUserId = foundUser._id;
          console.log('Found user with ID:', foundUserId);
          
          // Tạo chat với userId đã tìm thấy
          const resChat = await fetch(`${API_URL}/v1/chats`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${userToken}`
            },
            body: JSON.stringify({ participants: [currentUserIdLocal, foundUserId] })
          });
          
          if (!resChat.ok) throw new Error(`API error (${resChat.status})`);
          const chatData = await resChat.json();
          setChat(chatData);
          
          // Load messages for this chat
          fetchMessages(chatData._id);
        } catch (err) {
          console.error('Error finding user or creating chat:', err);
          throw new Error('Không thể tìm người dùng với email này. Vui lòng thử lại sau.');
        }
      }
    } catch (err: unknown) {
      console.error('Error creating chat:', err);
      
      // Provide more specific error messages based on the error
      if (err instanceof Error) {
        if (err.message === 'Không tìm thấy người dùng với email này') {
          setError('Không tìm thấy người dùng với email này. Vui lòng kiểm tra lại thông tin.');
        } else {
          setError('Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau. Lỗi: ' + err.message);
        }
      } else if (err instanceof Error) {
        setError(`Lỗi API (${err.message}): ${err.message || 'Vui lòng thử lại sau'}`);
      } else {
        setError('Không thể tạo cuộc trò chuyện. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages cho chat theo API pagination từ tài liệu
  const fetchMessages = async (chatId: string, pageNum = 1, append = false) => {
    try {
      if (pageNum === 1) {
        setError(null);
      }
      
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      
      // Get user token from AsyncStorage
      const userToken = await AsyncStorage.getItem('accessToken');
      
      if (!userToken) {
        throw new Error('Bạn cần đăng nhập để xem tin nhắn');
      }
      
      // Fetch messages via REST API using fetch
      const url = `${API_URL}/v1/chats/${chatId}/messages?page=${pageNum}&limit=20`;
      const resMsg = await fetch(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${userToken}` }
      });
      
      if (!resMsg.ok) throw new Error(`API error (${resMsg.status})`);
      const data = await resMsg.json();
      const msgs: Message[] = Array.isArray(data.messages) ? data.messages : [];
      
      // Kiểm tra còn tin nhắn để load thêm không
      if (msgs.length < 20) {
        setHasMoreMessages(false);
      }
      
      // Nếu đang append (load more), thêm vào danh sách hiện tại
      if (append) {
        setMessages(prevMessages => [...prevMessages, ...msgs]);
      } else {
        setMessages(msgs);
      }
      
      setPage(pageNum);
    } catch (err: unknown) {
      console.error('Error fetching messages:', err);
      setError('Không thể tải tin nhắn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load thêm tin nhắn cũ hơn
  const loadMoreMessages = () => {
    if (!hasMoreMessages || loadingMore || !chat?._id) return;
    fetchMessages(chat._id, page + 1, true);
  };

  // Handle typing indicator theo tài liệu, sử dụng socketService
  const handleTyping = () => {
    if (chat?._id) {
      socketService.sendTyping(chat._id);
      
      // Clear existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      // Set new timeout
      const timeout = setTimeout(() => {
        if (chat?._id) {
          socketService.sendStopTyping(chat._id);
        }
      }, 2000);
      
      setTypingTimeout(timeout as any);
    }
  };

  // Send a new message, sử dụng socketService
  const sendMessage = async () => {
    if (!newMessage.trim() || !chat?._id) return;
    
    setSending(true);
    try {
      Keyboard.dismiss();
      
      // Send stop typing event
      socketService.sendStopTyping(chat._id);
      
      // Send message via socket service
      socketService.sendMessage(chat._id, newMessage.trim());
      
      // Clear input and typing timeout
      setNewMessage('');
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    } catch (err: unknown) {
      console.error('Error sending message:', err);
      setError('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // Retry loading on error
  const handleRetry = () => {
    if (chat?._id) {
      fetchMessages(chat._id);
    } else {
      createOrGetChat();
    }
  };

  // Render a message item
  const renderMessage = ({ item }: { item: Message }) => {
    // Kiểm tra trước khi render để tránh lỗi
    if (!currentUserId) {
      console.warn('currentUserId not set yet - assuming message is not mine');
    }
    
    // Log chi tiết để debug
    console.log('Message data:', {
      text: item.text.substring(0, 15) + '...',
      sender: typeof item.sender === 'object' ? 
        JSON.stringify(item.sender) : item.sender,
      currentUserId
    });
    
    // Chuẩn hóa để so sánh
    let senderId = '';
    
    // Xử lý trường hợp khi item.sender là object
    if (typeof item.sender === 'object' && item.sender !== null) {
      senderId = String(item.sender._id || item.sender.id || '');
    } else {
      // Trường hợp item.sender là string hoặc primitive
      senderId = String(item.sender || '');
    }
    
    // Chuẩn hóa currentUserId
    const normalizedCurrentUserId = String(currentUserId || '');
    
    // So sánh và log kết quả
    const isMine = senderId.trim() === normalizedCurrentUserId.trim();
    console.log(`Is message mine? ${isMine ? 'YES' : 'NO'} (${senderId} vs ${normalizedCurrentUserId})`);
    
    return (
      <View style={styles.messageRow}>
        {isMine ? <View style={styles.spacer} /> : null}
        
        <View style={[
          styles.messageBubble, 
          isMine ? styles.myBubble : styles.theirBubble
        ]}>
          <Text style={[
            styles.messageText, 
            isMine ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.text}
          </Text>
          <Text style={[
            styles.messageTime, 
            isMine ? styles.myMessageTime : styles.theirMessageTime
          ]}>
            {new Date(item.createdAt).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        {!isMine ? <View style={styles.spacer} /> : null}
      </View>
    );
  };

  // Cập nhật hàm renderEmptyChat để chống lại hiệu ứng inverted của FlatList
  const renderEmptyChat = () => {
    if (loading) return null;
    
    return (
      <View style={[styles.emptyContainer, { transform: [{ scaleY: -1 }] }]}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>Chưa có tin nhắn nào</Text>
        <Text style={styles.emptySubtext}>Hãy bắt đầu cuộc trò chuyện với {recipient}</Text>
      </View>
    );
  };

  // Render loading indicator khi load thêm tin nhắn
  const renderFooter = () => {
    if (!loadingMore) return null;
    
    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#2196F3" />
        <Text style={styles.loadingMoreText}>Đang tải thêm tin nhắn...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{recipient}</Text>
        <View style={styles.headerRight}>
          {/* Optional: Add call or video call icons here */}
        </View>
      </View>
      
      {/* Messages List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Đang tải tin nhắn...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            ref={flatListRef}
            extraData={currentUserId}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item._id}
            contentContainerStyle={[
              styles.messagesList,
              isTyping && { paddingBottom: 40 }
            ]}
            inverted // To display most recent messages at the bottom
            ListEmptyComponent={renderEmptyChat}
            ListFooterComponent={renderFooter}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
          />
          
          {/* Typing indicator */}
          {isTyping && (
            <View style={styles.typingContainer}>
              <Text style={styles.typingText}>{recipient} đang nhập tin nhắn...</Text>
            </View>
          )}
        </>
      )}
      
      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập tin nhắn..."
            value={newMessage}
            onChangeText={(text) => {
              setNewMessage(text);
              handleTyping();
            }}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRight: {
    width: 40, // Reserve space for potential icons
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  retryButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2196F3',
    borderRadius: 5,
  },
  retryText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  messagesList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  messageContainer: {
    marginVertical: 6,
    paddingHorizontal: 16,
    width: '100%',
  },
  messageBubble: {
    maxWidth: '70%', // Thu nhỏ lại một chút
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  myBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
    borderBottomRightRadius: 0,
    marginLeft: '25%', // Tạo khoảng cách bên trái để tin nhắn hiển thị bên phải
  },
  theirBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 0,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: '25%', // Tạo khoảng cách bên phải để tin nhắn hiển thị bên trái
  },
  myMessageContainer: {
    alignItems: 'flex-end',
    alignSelf: 'flex-end',
    width: '100%',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    width: '100%',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#000',
  },
  theirMessageText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#555',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  myMessageTime: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  theirMessageTime: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
  typingContainer: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 8,
    borderRadius: 16,
  },
  typingText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  loadingMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingMoreText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  messageRow: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 8,
  },
  spacer: {
    flex: 1,
  },
});

export default ChatScreen;