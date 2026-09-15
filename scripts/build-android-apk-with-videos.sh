#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ANDROID_DIR="$ROOT_DIR/android"
APK_DIR="$ROOT_DIR/apk"

mkdir -p "$APK_DIR"

cd "$ANDROID_DIR"

if [[ -d "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home" ]]; then
    export JAVA_HOME="/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home"
    export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
fi

if [[ -d "$HOME/Library/Android/sdk" ]]; then
    export ANDROID_HOME="$HOME/Library/Android/sdk"
    export ANDROID_SDK_ROOT="$ANDROID_HOME"
fi

if [[ -x "./gradlew" ]]; then
    ./gradlew :app:clean :app:assembleDebug -PincludeVideos=true
else
    gradle :app:clean :app:assembleDebug -PincludeVideos=true
fi

cp "$ANDROID_DIR/app/build/outputs/apk/debug/app-debug.apk" "$APK_DIR/build-your-path-with-videos-debug.apk"
echo "APK copied to $APK_DIR/build-your-path-with-videos-debug.apk"
