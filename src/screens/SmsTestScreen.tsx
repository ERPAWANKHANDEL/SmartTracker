import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { checkSmsPermissions, requestSmsPermissions } from '../services/smsPermissions';
import { ingestSms } from '../services/smsIngestion';
import { getStoredSmsTransactions, initializeSmsListener } from '../services/smsStorage';
import { ParsedTransaction } from '../services/smsParser';
import { testSmsReading, requestSmsPermission } from '../services/smsTestUtils';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

export const SmsTestScreen = () => {
  const [hasPermissions, setHasPermissions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<ParsedTransaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [listenerActive, setListenerActive] = useState(false);

  useEffect(() => {
    checkPermissions();
    loadStoredTransactions();
    
    // Initialize SMS listener
    const unsubscribe = initializeSmsListener();
    setListenerActive(true);

    return () => {
      unsubscribe();
      setListenerActive(false);
    };
  }, []);

  const checkPermissions = async () => {
    const granted = await checkSmsPermissions();
    setHasPermissions(granted);
  };

  const handleRequestPermissions = async () => {
    const granted = await requestSmsPermission();
    setHasPermissions(granted);
    
    if (granted) {
      Alert.alert('Success', 'SMS permissions granted! You can now read transaction messages.');
      loadHistoricalSms();
    } else {
      Alert.alert('Permission Denied', 'SMS permission is required to read transaction messages.');
    }
  };

  const handleRunDiagnostics = async () => {
    Alert.alert('Running Diagnostics', 'Check the console for detailed logs...');
    await testSmsReading();
    Alert.alert('Diagnostics Complete', 'Check the console/logs for results.');
  };

  const loadHistoricalSms = async () => {
    setIsLoading(true);
    try {
      console.log('Loading historical SMS...');
      const txns = await ingestSms();
      console.log(`Loaded ${txns.length} transactions`);
      setTransactions(txns);
      Alert.alert(
        'SMS Loaded',
        `Found ${txns.length} financial transactions from your SMS inbox.${txns.length === 0 ? '\n\nIf you have SMS messages, try running diagnostics.' : ''}`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to load SMS messages. Check console for details.');
      console.error('Failed to load SMS:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStoredTransactions = async () => {
    try {
      const stored = await getStoredSmsTransactions();
      setTransactions(stored);
    } catch (error) {
      console.error('Failed to load stored transactions:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadStoredTransactions();
    setIsRefreshing(false);
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderTransaction = ({ item }: { item: ParsedTransaction }) => (
    <View style={styles.transactionCard}>
      <View style={styles.transactionHeader}>
        <Text style={[
          styles.transactionType,
          { color: item.type === 'credit' ? colors.success : colors.error }
        ]}>
          {item.type === 'credit' ? '↑ Credit' : '↓ Debit'}
        </Text>
        <Text style={styles.transactionAmount}>
          {formatAmount(item.amount)}
        </Text>
      </View>
      
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionMerchant}>
          {item.description || 'Transaction'}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(item.date)}
        </Text>
        {item.bank && (
          <Text style={styles.transactionBank}>
            {item.bank}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SMS Transaction Reader</Text>
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: listenerActive ? colors.success : colors.error }
          ]} />
          <Text style={styles.statusText}>
            Listener: {listenerActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {!hasPermissions ? (
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionText}>
            SMS permissions are required to read transaction messages.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={handleRequestPermissions}
          >
            <Text style={styles.buttonText}>Grant Permissions</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={loadHistoricalSms}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Load Historical SMS</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={loadStoredTransactions}
              >
                <Text style={styles.buttonTextSecondary}>Refresh Stored</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.button, styles.diagnosticButton]}
              onPress={handleRunDiagnostics}
            >
              <Text style={styles.buttonText}>🔍 Run Diagnostics</Text>
            </TouchableOpacity>

            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                Total Transactions: {transactions.length}
              </Text>
              <Text style={styles.statsText}>
                Credits: {transactions.filter(t => t.type === 'credit').length}
              </Text>
              <Text style={styles.statsText}>
                Debits: {transactions.filter(t => t.type === 'debit').length}
              </Text>
            </View>

            <FlatList
              data={transactions}
              keyExtractor={(item, index) => `${item.date}-${index}`}
              renderItem={renderTransaction}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>
                    {isLoading 
                      ? 'Loading transactions...'
                      : 'No transactions found. Try loading historical SMS or run diagnostics.'}
                  </Text>
                </View>
              }
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                />
              }
            />
          </ScrollView>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  actionContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  scrollContainer: {
    flex: 1,
  },
  button: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  diagnosticButton: {
    backgroundColor: colors.warning,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    backgroundColor: '#f5f5f5',
    marginHorizontal: spacing.md,
    borderRadius: 8,
  },
  statsText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  listContent: {
    padding: spacing.md,
  },
  transactionCard: {
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  transactionDetails: {
    marginBottom: spacing.xs,
  },
  transactionMerchant: {
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  transactionDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  transactionBank: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
