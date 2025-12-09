import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { IconBadge } from '../components/IconBadge';

const { width } = Dimensions.get('window');

interface OnboardingItem {
  id: string;
  iconName: string;
  title: string;
  description: string;
}

interface OnboardingScreenProps {
  onComplete: () => void;
}

const onboardingData: OnboardingItem[] = [
  {
    id: '1',
    iconName: 'transaction',
    title: 'Automatic SMS Tracking',
    description: 'SmartTracker automatically reads transaction SMS from your bank to track expenses effortlessly.',
  },
  {
    id: '2',
    iconName: 'dashboard',
    title: 'Smart Analytics',
    description: 'Get insights into your spending patterns with beautiful charts and detailed breakdowns.',
  },
  {
    id: '3',
    iconName: 'checklist',
    title: 'Secure & Private',
    description: 'Your financial data stays on your device. We prioritize your privacy and security.',
  },
];

const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < onboardingData.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      onComplete();
    }
  };

  const renderItem = ({ item }: { item: OnboardingItem }) => (
    <View style={styles.slide}>
      <IconBadge iconName={item.iconName} size={150} style={styles.emojiBadge} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  );

  const Paginator = () => (
    <View style={styles.paginatorContainer}>
      {onboardingData.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [10, 20, 10],
          extrapolate: 'clamp',
        });

        const opacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            style={[styles.dot, { width: dotWidth, opacity }]}
            key={i.toString()}
          />
        );
      })}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {currentIndex < onboardingData.length - 1 && (
        <TouchableOpacity style={styles.skipButtonTop} onPress={() => onComplete()}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.flatListContainer}>
        <FlatList
          data={onboardingData}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={32}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.xl) }]}>
        <Paginator />
        
        <View style={styles.buttonContainer}>
          <PrimaryButton
            label={currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            onPress={scrollTo}
            style={styles.nextButton}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flatListContainer: {
    flex: 3,
  },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emojiBadge: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  footer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  skipButtonTop: {
    position: 'absolute',
    top: spacing.xl + spacing.md,
    right: spacing.xl,
    zIndex: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  skipButtonText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.primary,
  },
  paginatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 64,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    flex: 1,
  },
});

export default OnboardingScreen;
