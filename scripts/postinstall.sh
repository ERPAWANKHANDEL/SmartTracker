#!/bin/bash

# Post-install script to patch react-native-sms-receiver build.gradle
# This fixes compatibility with modern React Native versions

GRADLE_FILE="node_modules/react-native-sms-receiver/android/build.gradle"

echo "🔧 Patching react-native-sms-receiver for modern React Native..."

if [ -f "$GRADLE_FILE" ]; then
    echo "📝 Patching build.gradle..."
    
    cat > "$GRADLE_FILE" << 'EOF'
// Top-level build file where you can add configuration options common to all sub-projects/modules.
def DEFAULT_COMPILE_SDK_VERSION = 36
def DEFAULT_BUILD_TOOLS_VERSION = '36.0.0'
def DEFAULT_MIN_SDK_VERSION = 24
def DEFAULT_TARGET_SDK_VERSION = 36

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

buildscript {
    if (project == rootProject) {
        repositories {
            google()
            mavenCentral()
        }
        dependencies {
            classpath("com.android.tools.build:gradle:8.0.0")
        }
    }
}

apply plugin: 'com.android.library'

android {
    compileSdkVersion safeExtGet('compileSdkVersion', DEFAULT_COMPILE_SDK_VERSION)
    buildToolsVersion safeExtGet('buildToolsVersion', DEFAULT_BUILD_TOOLS_VERSION)
    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', DEFAULT_MIN_SDK_VERSION)
        targetSdkVersion safeExtGet('targetSdkVersion', DEFAULT_TARGET_SDK_VERSION)
        versionCode 1
        versionName "1.0"
    }
    lintOptions {
        abortOnError false
    }
    namespace 'com.cakesoft.sms_receiver'
}

repositories {
    mavenLocal()
    maven {
        url "$rootDir/../node_modules/react-native/android"
    }
    maven {
        url "$rootDir/../node_modules/jsc-android/dist"
    }
    google()
    mavenCentral()
}

dependencies {
    implementation 'com.facebook.react:react-native:+'
}
EOF
    
    echo "   ✅ build.gradle patched"
else
    echo "   ⚠️  Warning: build.gradle not found"
fi

echo "✨ react-native-sms-receiver patching complete!"
