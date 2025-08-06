import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import SwipeStack from '@/components/SwipeStack';

export default function DiscoveryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <SwipeStack />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
}); 