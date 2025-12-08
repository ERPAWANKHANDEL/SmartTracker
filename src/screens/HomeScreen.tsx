import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>SmartTracker</Text>
          <Text style={styles.headerSubtitle}>Your Financial Dashboard</Text>
          <SecondaryButton
            label="View History"
            onPress={() => navigation.navigate('TransactionHistory' as never)}
            style={styles.historyButton}
          />
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Balance</Text>
          <Text style={styles.balanceAmount}>₹0.00</Text>
          <Text style={styles.balanceSubtext}>No transactions yet</Text>
        </View>

        <View style={styles.quickStats}>
          <View style={[styles.statCard, styles.statSpacer]}>
            <Text style={styles.statEmoji}>💰</Text>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Income</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>💸</Text>
            <Text style={styles.statValue}>₹0</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Your transactions will appear here
            </Text>
          </View>
        </View>

        <PrimaryButton
          label="+ Add Transaction"
          onPress={() => navigation.navigate('ManualExpense' as never)}
          style={styles.addButton}
        />

        <SecondaryButton
          label="📱 SMS Test Screen"
          onPress={() => navigation.navigate('SmsTest' as never)}
          style={styles.smsTestButton}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSizes['4xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  historyButton: {
    alignSelf: 'flex-start',
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: spacing.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: fontSizes.sm,
    color: colors.surface,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: fontWeights.bold,
    color: colors.surface,
    marginBottom: spacing.xs,
  },
  balanceSubtext: {
    fontSize: fontSizes.sm,
    color: colors.surface,
    opacity: 0.8,
  },
  quickStats: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
  },
  statSpacer: {
    marginRight: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  statValue: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: spacing.md,
    padding: spacing.xxl,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  addButton: {
    marginTop: spacing.lg,
  },
  smsTestButton: {
    marginTop: spacing.md,
  },
});

export default HomeScreen;
