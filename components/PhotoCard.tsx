import React from 'react';
import { View, Image, Text, TouchableOpacity, StyleSheet } from 'react-native';

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

// Định nghĩa kiểu props cho PhotoCard
interface PhotoCardProps {
  photo: Photo;
  onPress: (photo: Photo) => void;
}

const PhotoCard: React.FC<PhotoCardProps> = ({ photo, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(photo)}>
      <Image
        source={{ uri: photo.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.description} numberOfLines={2}>
          {photo.description}
        </Text>
        <Text style={styles.user}>By {photo.user.name}</Text>
        <Text style={styles.likes}>{photo.likes} Likes</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 150,
  },
  info: {
    padding: 10,
  },
  description: {
    fontSize: 14,
    color: '#333',
    marginBottom: 5,
  },
  user: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  likes: {
    fontSize: 12,
    color: '#273c75',
    fontWeight: '600',
  },
});

export default PhotoCard;