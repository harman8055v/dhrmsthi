import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useAuth, UserProfile } from '@/src/context/AuthContext';

const { width, height } = Dimensions.get('window');

interface SwipeStats {
  swipes_used: number;
  swipes_remaining: number;
  super_likes_used: number;
  super_likes_available: number;
  daily_limit: number;
  can_swipe: boolean;
  current_plan: string;
}

interface DiscoveredProfile extends UserProfile {
  age?: number;
  location?: string;
}

interface UndoAction {
  profile: DiscoveredProfile;
  index: number;
  direction: 'left' | 'right' | 'superlike';
  action: string;
}

// Spiritual loading screen
function SpiritualLoadingScreen() {
  // ... same as DiscoveryScreen version ...
  return (
    <View style={styles.container}>
      <Text>Loading Spiritual Matches...</Text>
    </View>
  );
}

// SwipeCard component
function SwipeCard({ /* props */ }: any) {
  // ... same as DiscoveryScreen version SwipeCard ...
  return <View />;
}

export default function SwipeStack() {
  const { user, profile, isVerified } = useAuth();
  const [profiles, setProfiles] = useState<DiscoveredProfile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipeStats, setSwipeStats] = useState<SwipeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [exitingCard, setExitingCard] = useState<any>(null);
  const [processingSwipe, setProcessingSwipe] = useState(false);
  const [fetchingProfiles, setFetchingProfiles] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<DiscoveredProfile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  useEffect(() => {
    // ... fetchData that calls /api/swipe/stats and /api/profiles/discover ...
  }, []);

  const handleSwipe = (direction: 'left' | 'right' | 'superlike', profileId: string) => {
    // ... exact swipe logic from web app, using fetch and animations ...
  };

  const handleUndo = async () => {
    // ... undo logic via DELETE /api/swipe ...
  };

  const handleViewProfile = (p: DiscoveredProfile) => {
    setSelectedProfile(p);
    setProfileModalOpen(true);
  };

  if (loading) return <SpiritualLoadingScreen />;
  if (error) return (
    <SafeAreaView><Text>Error: {error}</Text></SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header, Card Stack, Action Buttons, ProfileModal */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  // ... include all styles from DiscoveryScreen ...
}); 