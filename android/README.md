# Android package

This project wraps the static Build Your Path site in an Android WebView for tablet use.

The Gradle `stageWebAssets` task copies the site into `app/build/generated/assets/www` before each build. During that copy, `wis.json` is rewritten for the APK build only. The source `wis.json` used by the website is not changed.

The default build blanks every `video_url` and excludes the `videos/` folder:

Build from the repository root:

```sh
./scripts/build-android-apk.sh
```

The local video build includes the `videos/` folder and rewrites matching `video_url` values to local MP4 paths:

```sh
./scripts/build-android-apk-with-videos.sh
```

Requirements:

- Java JDK
- Android SDK with API 35
- Gradle, or a Gradle wrapper added to `android/`

The generated debug APKs are copied to:

- `apk/build-your-path-debug.apk`
- `apk/build-your-path-with-videos-debug.apk`
