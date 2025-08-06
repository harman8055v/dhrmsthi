import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

interface CameraOptions {
  mediaTypes?: 'images' | 'videos' | 'all';
  allowsEditing?: boolean;
  quality?: number;
  allowsMultipleSelection?: boolean;
}

interface CameraResult {
  success: boolean;
  uri?: string;
  base64?: string;
  error?: string;
  cancelled?: boolean;
}

export class CameraService {
  
  /**
   * Request camera permissions
   */
  static async requestCameraPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return false;
    }
  }

  /**
   * Request media library permissions
   */
  static async requestMediaLibraryPermissions(): Promise<boolean> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request media library permissions:', error);
      return false;
    }
  }

  /**
   * Handle camera request from WebView
   */
  static async handleCameraRequest(
    payload: { action: string; options?: CameraOptions },
    callback: (result: CameraResult) => void
  ): Promise<void> {
    
    const { action, options = {} } = payload;
    
    try {
      if (action === 'open') {
        await this.openCamera(options, callback);
      } else if (action === 'picker') {
        await this.openImagePicker(options, callback);
      } else if (action === 'choose') {
        // Show action sheet to choose between camera and gallery
        await this.showImageSourceSelector(options, callback);
      } else {
        callback({
          success: false,
          error: 'Invalid camera action'
        });
      }
    } catch (error) {
      console.error('Camera service error:', error);
      callback({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown camera error'
      });
    }
  }

  /**
   * Open camera to take photo
   */
  static async openCamera(
    options: CameraOptions = {},
    callback: (result: CameraResult) => void
  ): Promise<void> {
    
    // Request permissions
    const hasPermission = await this.requestCameraPermissions();
    if (!hasPermission) {
      callback({
        success: false,
        error: 'Camera permission denied'
      });
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: this.mapMediaTypes(options.mediaTypes),
        allowsEditing: options.allowsEditing ?? true,
        aspect: [4, 3],
        quality: options.quality ?? 0.8,
        base64: true,
      });

      if (result.canceled) {
        callback({
          success: false,
          cancelled: true
        });
        return;
      }

      const asset = result.assets[0];
      callback({
        success: true,
        uri: asset.uri,
        base64: asset.base64 || undefined
      });

    } catch (error) {
      console.error('Camera error:', error);
      callback({
        success: false,
        error: error instanceof Error ? error.message : 'Camera error'
      });
    }
  }

  /**
   * Open image picker from gallery
   */
  static async openImagePicker(
    options: CameraOptions = {},
    callback: (result: CameraResult) => void
  ): Promise<void> {
    
    // Request permissions
    const hasPermission = await this.requestMediaLibraryPermissions();
    if (!hasPermission) {
      callback({
        success: false,
        error: 'Media library permission denied'
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: this.mapMediaTypes(options.mediaTypes),
        allowsEditing: options.allowsEditing ?? true,
        aspect: [4, 3],
        quality: options.quality ?? 0.8,
        base64: true,
        allowsMultipleSelection: options.allowsMultipleSelection ?? false,
      });

      if (result.canceled) {
        callback({
          success: false,
          cancelled: true
        });
        return;
      }

      const asset = result.assets[0];
      callback({
        success: true,
        uri: asset.uri,
        base64: asset.base64 || undefined
      });

    } catch (error) {
      console.error('Image picker error:', error);
      callback({
        success: false,
        error: error instanceof Error ? error.message : 'Image picker error'
      });
    }
  }

  /**
   * Show action sheet to choose between camera and gallery
   */
  static async showImageSourceSelector(
    options: CameraOptions = {},
    callback: (result: CameraResult) => void
  ): Promise<void> {
    
    Alert.alert(
      'Select Image',
      'Choose how you want to select an image',
      [
        {
          text: 'Camera',
          onPress: () => this.openCamera(options, callback),
        },
        {
          text: 'Gallery',
          onPress: () => this.openImagePicker(options, callback),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => callback({
            success: false,
            cancelled: true
          }),
        },
      ],
      { cancelable: true }
    );
  }

  /**
   * Map media types to ImagePicker format
   */
  private static mapMediaTypes(mediaTypes?: string): ImagePicker.MediaTypeOptions {
    switch (mediaTypes) {
      case 'videos':
        return ImagePicker.MediaTypeOptions.Videos;
      case 'all':
        return ImagePicker.MediaTypeOptions.All;
      case 'images':
      default:
        return ImagePicker.MediaTypeOptions.Images;
    }
  }

  /**
   * Compress image
   */
  static async compressImage(uri: string, quality: number = 0.8): Promise<string> {
    try {
      // In a production app, you might want to use expo-image-manipulator
      // for more advanced image processing
      return uri;
    } catch (error) {
      console.error('Image compression error:', error);
      return uri;
    }
  }

  /**
   * Get image info
   */
  static async getImageInfo(uri: string): Promise<{
    width: number;
    height: number;
    size?: number;
  } | null> {
    try {
      // You can use expo-image-manipulator to get image info
      return null;
    } catch (error) {
      console.error('Get image info error:', error);
      return null;
    }
  }
}
