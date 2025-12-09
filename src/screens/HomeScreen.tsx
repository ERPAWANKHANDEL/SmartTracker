import React, { useEffect, useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Modal, TouchableOpacity, ActivityIndicator, Platform, Animated, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { check, request, PERMISSIONS, RESULTS, openSettings } from 'react-native-permissions';
import { PrimaryButton, SecondaryButton } from '../components/Buttons';
import { Icon } from '../components/Icon';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { fontSizes, fontWeights } from '../theme/typography';
import { getStoredSmsTransactions } from '../services/smsStorage';
import { ingestSms } from '../services/smsIngestion';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setSmsTransactions, setManualTransactions } from '../store/transactionsSlice';
import { setAuthenticated } from '../store/authSlice';
import {
  selectTotalBalance,
  selectMonthlyStats,
  selectCategorySpending,
  selectRecentTransactions,
  selectSmsTransactions,
  selectManualTransactions,
} from '../store/selectors';

const screenWidth = Dimensions.get('window').width;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const totalBalance = useAppSelector(selectTotalBalance);
  const monthlyStats = useAppSelector(selectMonthlyStats);
  const categorySpending = useAppSelector(selectCategorySpending);
  const recentTransactions = useAppSelector(selectRecentTransactions);
  const smsTransactions = useAppSelector(selectSmsTransactions);
  const manualTransactions = useAppSelector(selectManualTransactions);

  // Permission modal states
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [isLoadingSms, setIsLoadingSms] = useState(false);
  const [permissionChecked, setPermissionChecked] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useState(new Animated.Value(0))[0];
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  // Show toast notification
  const showToastNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);

    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setShowToast(false));
  };

  // Check permissions on mount
  useEffect(() => {
    checkAndRequestPermissions();
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load transactions from storage only once on mount
  useEffect(() => {
    const loadStoredData = async () => {
      try {
        // Load stored SMS transactions
        const sms = await getStoredSmsTransactions();
        if (sms.length > 0 && smsTransactions.length === 0) {
          dispatch(setSmsTransactions(sms));
        }

        // Load manual transactions
        const manualData = await AsyncStorage.getItem('@manual_transactions');
        const manual = manualData ? JSON.parse(manualData) : [];
        if (manual.length > 0 && manualTransactions.length === 0) {
          dispatch(setManualTransactions(manual));
        }
      } catch (error) {
        console.error('Failed to load stored transactions:', error);
      }
    };

    if (permissionChecked) {
      loadStoredData();
    }
  }, [permissionChecked]);

  // No useFocusEffect needed - Redux persists data across navigation

  const checkAndRequestPermissions = async () => {
    if (Platform.OS !== 'android') {
      // iOS doesn't support SMS reading
      setPermissionChecked(true);
      return;
    }

    try {
      const result = await check(PERMISSIONS.ANDROID.READ_SMS);

      if (result === RESULTS.GRANTED) {
        // Permission granted - fetch and load SMS
        console.log('SMS permission already granted');
        setPermissionChecked(true);
        await fetchAndLoadSms();
        await loadManualTransactions();
      } else if (result === RESULTS.DENIED) {
        // Show permission request modal
        console.log('SMS permission not granted - showing modal');
        setShowPermissionModal(true);
        setPermissionChecked(true);
      } else if (result === RESULTS.BLOCKED) {
        // Permission permanently blocked
        console.log('SMS permission blocked');
        setPermissionBlocked(true);
        setShowPermissionModal(true);
        setPermissionChecked(true);
      } else {
        // Other states (unavailable, limited)
        setPermissionChecked(true);
      }
    } catch (error) {
      console.error('Error checking SMS permissions:', error);
      setPermissionChecked(true);
    }
  };

  const fetchAndLoadSms = async () => {
    setIsLoadingSms(true);
    try {
      console.log('Fetching SMS messages...');
      const transactions = await ingestSms();
      dispatch(setSmsTransactions(transactions));
      
      if (transactions.length > 0) {
        showToastNotification(
          `Loaded ${transactions.length} financial transactions from SMS`,
          'success'
        );
      }
    } catch (error) {
      console.error('Failed to fetch SMS:', error);
      showToastNotification(
        'Failed to read SMS. You can add transactions manually.',
        'error'
      );
    } finally {
      setIsLoadingSms(false);
    }
  };

  const loadManualTransactions = async () => {
    try {
      const manualData = await AsyncStorage.getItem('@manual_transactions');
      const manual = manualData ? JSON.parse(manualData) : [];
      dispatch(setManualTransactions(manual));
    } catch (error) {
      console.error('Failed to load manual transactions:', error);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const result = await request(PERMISSIONS.ANDROID.READ_SMS);

      if (result === RESULTS.GRANTED) {
        console.log('SMS permission granted by user');
        setShowPermissionModal(false);
        setPermissionBlocked(false);
        // Fetch SMS immediately after grant
        await fetchAndLoadSms();
      } else if (result === RESULTS.BLOCKED) {
        console.log('SMS permission blocked by user');
        setPermissionBlocked(true);
        // Keep modal open to show settings option
      } else {
        console.log('SMS permission denied by user');
        setShowPermissionModal(false);
        showToastNotification(
          'You can add transactions manually or enable SMS permission later',
          'info'
        );
      }
    } catch (error) {
      console.error('Error requesting SMS permission:', error);
      showToastNotification(
        'Failed to request permission. Please try again.',
        'error'
      );
    }
  };

  const handleOpenSettings = async () => {
    try {
      await openSettings();
      setShowPermissionModal(false);
    } catch (error) {
      console.error('Error opening settings:', error);
      showToastNotification(
        'Failed to open settings. Please open app settings manually.',
        'error'
      );
    }
  };

  const handleSkipPermission = () => {
    setShowPermissionModal(false);
    showToastNotification(
      'Manual mode enabled. Grant SMS permission anytime from settings.',
      'info'
    );
  };

  const handleExit = () => {
    dispatch(setAuthenticated(false));
    BackHandler.exitApp();
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  // Prepare data for pie chart
  const getPieChartData = () => {
    return categorySpending.map(cat => ({
      name: cat.category,
      amount: cat.total,
      color: cat.color,
      legendFontColor: colors.text,
      legendFontSize: 13,
    }));
  };

  const pieChartData = getPieChartData();

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>SmartTracker</Text>
            <Text style={styles.headerSubtitle}>Your Financial Dashboard</Text>
          </View>
          <TouchableOpacity onPress={handleExit} style={styles.exitButton}>
            <Text style={styles.exitButtonText}>× Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <Animated.View style={[styles.balanceCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.balanceCardHeader}>
            <View style={styles.balanceIconContainer}>
              <Icon name="transaction" size={20} tintColor="#fff" />
            </View>
            <Text style={styles.balanceLabel}>Total Bank Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>{formatAmount(totalBalance)}</Text>
          <View style={styles.balanceFooter}>
            <View style={styles.balanceBadge}>
              <View style={styles.badgeContent}>
                <Icon name="dashboard" size={12} tintColor="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.balanceBadgeText}>
                  {smsTransactions.length + manualTransactions.length} transactions
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Monthly Stats */}
        <Animated.View style={[styles.quickStats, { opacity: fadeAnim }]}>
          <View style={[styles.statCard, styles.statSpacer, styles.incomeCard]}>
            <View style={styles.statIconContainer}>
              <Icon name="profit" size={24} tintColor={colors.success} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={styles.statValue}>{formatAmount(monthlyStats.income)}</Text>
              <Text style={styles.statPeriod}>This Month</Text>
            </View>
          </View>

          <View style={[styles.statCard, styles.expenseCard]}>
            <View style={styles.statIconContainer}>
              <Icon name="arrow" size={24}  style={{ transform: [{ rotate: '180deg' }] }} />
            </View>
            <View style={styles.statContent}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={styles.statValue}>{formatAmount(monthlyStats.expenses)}</Text>
              <Text style={styles.statPeriod}>This Month</Text>
            </View>
          </View>
        </Animated.View>

        {/* Category-wise Spending */}
        {categorySpending.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category-wise Spending</Text>
            
            {/* Pie Chart */}
            <View style={styles.chartContainer}>
              <PieChart
                data={pieChartData}
                width={screenWidth - (spacing.xl * 2)}
                height={260}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="70"
                absolute
                hasLegend={false}
              />
            </View>

            {/* Progress Bars for detailed view */}
            <View style={styles.categoryContainer}>
              {categorySpending.map((cat, idx) => (
                <View key={idx} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLabelRow}>
                      <View style={[styles.colorDot, { backgroundColor: cat.color }]} />
                      <Text style={styles.categoryName}>{cat.category}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>{formatAmount(cat.total)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${cat.percentage}%`, backgroundColor: cat.color }]} />
                  </View>
                  <Text style={styles.categoryPercentage}>{cat.percentage.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Last 5 Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <SecondaryButton
              label="View All"
              onPress={() => navigation.navigate('History' as never)}
              style={styles.viewAllButton}
            />
          </View>
          {recentTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Icon name="checklist" size={56} tintColor={colors.textTertiary} />
              </View>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Add transactions manually or enable SMS reading
              </Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {recentTransactions.map((txn, idx) => (
                <View key={idx} style={styles.transactionItem}>
                  <View style={styles.transactionIconWrapper}>
                    <View style={[
                      styles.transactionIconContainer,
                      { backgroundColor: txn.type === 'credit' ? '#DEF7EC' : '#FEE2E2' }
                    ]}>
                      <Text style={styles.transactionIcon}>
                        {txn.type === 'credit' ? '↓' : '↑'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.transactionLeft}>
                    <Text style={styles.transactionDesc} numberOfLines={1}>{txn.description}</Text>
                    <View style={styles.transactionDateRow}>
                      <Icon name="history" size={10} tintColor={colors.textTertiary} style={{ marginRight: 4 }} />
                      <Text style={styles.transactionDate}>{formatDate(txn.date)}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={[
                      styles.transactionAmount,
                      { color: txn.type === 'credit' ? colors.success : colors.error }
                    ]}>
                      {txn.type === 'credit' ? '+' : '-'}{formatAmount(Math.abs(txn.amount))}
                    </Text>
                    <Text style={styles.transactionType}>{txn.type}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <PrimaryButton
          label="+ Add Transaction"
          onPress={() => navigation.navigate('ManualExpense' as never)}
          style={styles.addButton}
        />
      </ScrollView>

      {/* Permission Request Modal */}
      <Modal
        visible={showPermissionModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !permissionBlocked && setShowPermissionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Icon name="transaction" size={48} tintColor={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>
                {permissionBlocked ? 'Permission Required' : 'Enable SMS Reading'}
              </Text>
            </View>

            <Text style={styles.modalDescription}>
              {permissionBlocked
                ? 'SMS permission is currently blocked. Please enable it in Settings to automatically track your financial transactions.'
                : 'Allow SmartTracker to read SMS messages to automatically track your bank transactions and spending.'}
            </Text>

            <View style={styles.modalFeatures}>
              <View style={styles.featureRow}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.featureText}>Auto-track bank transactions</Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.featureText}>Real-time expense monitoring</Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.featureText}>40+ banks supported</Text>
              </View>
              <View style={styles.featureRow}>
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
                <Text style={styles.featureText}>Your data stays private</Text>
              </View>
            </View>

            {isLoadingSms && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Loading SMS transactions...</Text>
              </View>
            )}

            <View style={styles.modalButtons}>
              {permissionBlocked ? (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleOpenSettings}
                  >
                    <Text style={styles.modalButtonTextPrimary}>Open Settings</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={handleSkipPermission}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Add Manually</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={handleRequestPermission}
                    disabled={isLoadingSms}
                  >
                    <Text style={styles.modalButtonTextPrimary}>Grant Permission</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={handleSkipPermission}
                    disabled={isLoadingSms}
                  >
                    <Text style={styles.modalButtonTextSecondary}>Skip for Now</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast Notification */}
      {showToast && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              opacity: toastOpacity,
              backgroundColor:
                toastType === 'success'
                  ? colors.success
                  : toastType === 'error'
                  ? colors.error
                  : colors.primary,
            },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  scrollContent: {
    padding: spacing.xl,
    backgroundColor:colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  headerTitle: {
    fontSize: fontSizes['3xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: fontSizes.md,
    color: colors.textTertiary,
    marginBottom: spacing.sm,
  },
  exitButton: {
    backgroundColor: colors.error,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  exitButtonText: {
    color: colors.surface,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.semibold,
  },
  historyButton: {
    alignSelf: 'flex-start',
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: spacing.xl,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  balanceIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  balanceIcon: {
    fontSize: 20,
  },
  balanceLabel: {
    fontSize: fontSizes.sm,
    color: colors.surface,
    opacity: 0.95,
    fontWeight: fontWeights.medium,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: fontWeights.bold,
    color: colors.surface,
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  balanceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing.lg,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceBadgeText: {
    fontSize: fontSizes.xs,
    color: colors.surface,
    fontWeight: fontWeights.medium,
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
    borderRadius: spacing.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: spacing.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  statEmoji: {
    fontSize: 24,
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    fontWeight: fontWeights.medium,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: 2,
  },
  statPeriod: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  viewAllButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyState: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    padding: spacing.xxl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyIconContainer: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.bold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSizes.sm,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  addButton: {
    marginTop: spacing.lg,
  },
  smsTestButton: {
    marginTop: spacing.md,
  },
  categoryContainer: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryItem: {
    marginBottom: spacing.md,
    flex:1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryName: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: fontWeights.medium,
  },
  categoryAmount: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: fontWeights.semibold,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    textAlign: 'right',
  },
  transactionsList: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  transactionIconWrapper: {
    marginRight: spacing.sm,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionIcon: {
    fontSize: 20,
    fontWeight: fontWeights.bold,
  },
  transactionLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  transactionDesc: {
    fontSize: fontSizes.sm,
    color: colors.text,
    fontWeight: fontWeights.semibold,
    marginBottom: 2,
  },
  transactionDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.bold,
    marginBottom: 2,
  },
  transactionType: {
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    textTransform: 'capitalize',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: spacing.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalIconContainer: {
    marginBottom: spacing.sm,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkmarkText: {
    color: colors.surface,
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.bold,
  },
  modalTitle: {
    fontSize: fontSizes['2xl'],
    fontWeight: fontWeights.bold,
    color: colors.text,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  modalFeatures: {
    backgroundColor: colors.background,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  featureText: {
    fontSize: fontSizes.sm,
    color: colors.text,
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  loadingText: {
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  modalButtons: {
    gap: spacing.md,
  },
  modalButton: {
    paddingVertical: spacing.md,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: colors.primary,
  },
  modalButtonSecondary: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonTextPrimary: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.surface,
  },
  modalButtonTextSecondary: {
    fontSize: fontSizes.md,
    fontWeight: fontWeights.semibold,
    color: colors.textSecondary,
  },
  // Toast notification styles
  toastContainer: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    right: spacing.lg,
    padding: spacing.md,
    borderRadius: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
  },
  toastText: {
    color: colors.surface,
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium,
    flex: 1,
  },
});

export default HomeScreen;
