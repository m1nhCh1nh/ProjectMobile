import { useState, useEffect } from 'react';

// Định nghĩa kiểu dữ liệu cho một ảnh
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

export const usePhotos = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = async () => {
    // Tạo controller để có thể hủy request nếu cần
    const controller = new AbortController();
    // Thiết lập timeout thủ công
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      setLoading(true);
      const response = await fetch('http://192.168.110.143:3000/photos', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal // Sử dụng signal từ controller
      });

      // Xóa timeout nếu request thành công
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Không tìm thấy ảnh. Vui lòng kiểm tra API.');
        } else {
          throw new Error(`Lỗi khi lấy dữ liệu ảnh: ${response.statusText}`);
        }
      }

      const data: Photo[] = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Dữ liệu trả về không phải là danh sách ảnh.');
      }

      setPhotos(data);
      setError(null);
    } catch (err: any) {
      // Xóa timeout nếu có lỗi
      clearTimeout(timeoutId);
      
      console.error('Lỗi trong usePhotos:', err);
      setError(err.message || 'Có lỗi xảy ra khi lấy dữ liệu ảnh');
      setPhotos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    
    // Cleanup function để tránh memory leak
    return () => {
      // Không cần làm gì nếu đã xử lý cleanup trong fetchPhotos
    };
  }, []);

  return { photos, loading, error, refetch: fetchPhotos };
};