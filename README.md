# 💰 SmartTracker

<div align="center">

**AI-Powered Expense Tracking Made Simple**

[![React Native](https://img.shields.io/badge/React%20Native-0.82.1-blue.svg)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)]()

*Automatically track your expenses through SMS, visualize spending patterns, and manage your budget with ease.*

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Troubleshooting](#-troubleshooting)

</div>

---

## 📋 Overview

**SmartTracker** is a modern React Native mobile application that revolutionizes personal finance management by automatically tracking expenses through SMS messages. With AI-powered SMS parsing, biometric security, and beautiful data visualizations, managing your money has never been easier.

## ✨ Features

### 🤖 Smart Automation
- **Automatic SMS Ingestion** - Reads and parses transaction SMS from banks/payment apps

- **Real-time Processing** - Transactions are automatically categorized as they arrive

### 📊 Financial Insights
- **Visual Analytics** - Beautiful pie charts and spending trends
- **Category Breakdown** - Track spending across Food, Shopping, Transport, Bills, and more
- **Transaction History** - Complete timeline of all expenses with filtering options
- **Balance Overview** - Real-time income vs. expense tracking

### 🔒 Security & Privacy
- **Biometric Authentication** - Secure app access with fingerprint/Face ID
- **Local Data Storage** - All data stored securely on device using AsyncStorage
- **Permission Management** - Granular control over SMS and notification access

### 🎨 User Experience
- **Modern UI/UX** - Clean, intuitive interface with smooth animations
- **Dark Mode Support** - Eye-friendly design with consistent theming
- **Custom Icons** - Beautiful custom PNG icons throughout the app
- **Animated Splash Screen** - Engaging app launch experience with pulse animations
- **Manual Entry** - Add expenses manually with category selection
- **Edit & Delete** - Full control over transaction management

### 📱 Native Features
- **Bottom Tab Navigation** - Easy switching between Dashboard and History
- **Onboarding Flow** - Smooth first-time user experience
- **Permissions Screen** - Clear explanation of required permissions
- **Empty States** - Helpful guidance when no data is available

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have completed the [React Native Environment Setup](https://reactnative.dev/docs/set-up-your-environment):

- **Node.js** 18+ and npm/yarn
- **React Native CLI** tools
- **Android Studio** (for Android development)
  - Android SDK with API Level 24+
  - NDK 27.1.12297006 (or 25.1.8937393 for Apple Silicon Macs)
- **Xcode** (for iOS development - macOS only)
  - iOS 13+
  - CocoaPods

### Clone the Repository

```bash
git clone https://github.com/ERPAWANKHANDEL/SmartTracker.git
cd SmartTracker
```

### Install Dependencies

```bash
npm install
# or
yarn install
```

### iOS Setup (macOS only)

```bash
# Install Ruby dependencies
bundle install

# Install CocoaPods dependencies
cd ios
bundle exec pod install
cd ..
```

## 🏃 Running the App

### Start Metro Bundler

```bash
npm start
# or
yarn start
```

### Run on Android

```bash
npm run android
# or
yarn android
```

**Important for Apple Silicon Macs:**
If you encounter NDK/CMake errors, ensure you have the correct NDK version installed:
1. Open Android Studio → SDK Manager → SDK Tools
2. Install NDK version 27.1.12297006 or 25.1.8937393
3. Verify the toolchain matches your Mac architecture (darwin-arm64)

### Run on iOS

```bash
npm run ios
# or
yarn ios
```

## 🛠️ Tech Stack

### Core
- **React Native** 0.82.1 - Cross-platform mobile framework
- **TypeScript** - Type-safe development
- **React** 19.1.1 - UI library

### State Management
- **Redux Toolkit** - Efficient state management
- **React Redux** - React bindings for Redux

### Navigation
- **React Navigation** 7.x - Native navigation
  - Bottom Tabs
  - Native Stack Navigator

### Data & Storage
- **AsyncStorage** - Persistent local storage
- **Custom SMS Parser** - Transaction extraction from SMS

### UI & Visualization
- **React Native SVG** - Vector graphics
- **React Native Chart Kit** - Beautiful charts and graphs
- **Custom Icon System** - PNG-based icon components

### Forms & Validation
- **Formik** - Form management
- **Yup** - Schema validation

### Security
- **React Native Biometrics** - Fingerprint/Face ID authentication
- **React Native Permissions** - Permission management

### Additional Libraries
- **React Native Gesture Handler** - Native gesture handling
- **React Native Screens** - Native screen components
- **React Native Safe Area Context** - Safe area handling
- **React Native Splash Screen** - Custom splash screen

## 📁 Project Structure

```
SmartTracker/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Buttons.tsx
│   │   ├── FeatureItem.tsx
│   │   └── IconBadge.tsx
│   ├── screens/             # App screens
│   │   ├── SplashScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── PermissionsScreen.tsx
│   │   ├── BiometricLockScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── ManualExpenseScreen.tsx
│   │   └── TransactionHistoryScreen.tsx
│   ├── services/            # Business logic
│   │   ├── smsAndroidReader.ts
│   │   ├── smsParser.ts
│   │   ├── smsIngestion.ts
│   │   └── smsStorage.ts
│   ├── data/                # Mock data & constants
│   │   └── transactions.ts
│   ├── theme/               # Design system
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   └── assests/             # Static assets
│       └── icons/           # Custom PNG icons
├── android/                 # Android native code
├── ios/                     # iOS native code
└── App.tsx                  # Root component
```

## 🔧 Configuration

### Android Permissions

The app requires the following permissions (declared in `AndroidManifest.xml`):
- `READ_SMS` - To read transaction SMS
- `RECEIVE_SMS` - To receive new SMS in real-time
- `USE_BIOMETRIC` - For biometric authentication

### Customization

**Theme Colors** - Edit `src/theme/colors.ts`:
```typescript
export const colors = {
  primary: '#6200EE',
  secondary: '#03DAC6',
  // ... customize your brand colors
}
```

**Categories** - Modify transaction categories in `src/data/transactions.ts`

## 🐛 Troubleshooting

### Common Issues

**1. NDK/CMake Errors on Apple Silicon Macs**
```bash
# Solution: Install correct NDK version
# Open Android Studio → SDK Manager → SDK Tools
# Install NDK 25.1.8937393 or 27.1.12297006
# Ensure darwin-arm64 toolchain is installed (not darwin-x86_64)
```

**2. Metro Bundler Issues**
```bash
# Clear cache and restart
npm start -- --reset-cache
# or
watchman watch-del-all
npm start
```

**3. Android Build Failures**
```bash
# Clean build
cd android
./gradlew clean
cd ..
npm run android
```

**4. iOS Pod Installation Issues**
```bash
cd ios
pod deintegrate
pod install
cd ..
```

**5. Permission Denied Errors**
```bash
# Fix file permissions
chmod -R 755 node_modules
```

**6. Gradle Build Stuck**
```bash
# Stop all Gradle daemons
cd android
./gradlew --stop
cd ..
```

## 📱 Supported Platforms

- ✅ Android 7.0+ (API Level 24+)
- ✅ iOS 13.0+

## 🎯 Roadmap

- [ ] Cloud sync and backup
- [ ] Budget tracking and alerts
- [ ] Recurring transaction detection
- [ ] Export to CSV/PDF
- [ ] Multi-currency support
- [ ] Dark mode toggle
- [ ] Widget support
- [ ] Machine learning for better categorization

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

**ERPAWANKHANDEL**
- GitHub: [@ERPAWANKHANDEL](https://github.com/ERPAWANKHANDEL)

## 🙏 Acknowledgments

- React Native community for excellent documentation
- All open-source libraries used in this project
- Icons and design inspiration from modern fintech apps

## 📞 Support

For support, please open an issue in the GitHub repository.

---

<div align="center">

**Made with ❤️ using React Native**

⭐ Star this repo if you find it helpful!

</div>
