# Android app

The frontend is packaged for Android with Capacitor. GitHub Actions builds a debug APK on pushes to `main` or `master`, pull requests that change the frontend, and manual workflow runs.

## Get the APK

Open the repository's **Actions** tab, select **Android app**, and download the `nextus-android-debug` artifact from a completed run. Install `app-debug.apk` on an Android device. Debug APKs are for testing and are not signed for Play Store publishing.

## Configure the API address

The app needs a backend reachable from the phone. Set the repository variable `NEXTUS_API_BASE_URL` to the public HTTPS API base URL, such as `https://api.example.com/api/v1`. A manual workflow run can override it with the `api_base_url` input. If neither is set, the workflow uses `http://10.0.2.2:3000/api/v1`, which is only useful from an Android emulator with the backend running on the development host.

The backend must allow requests from the Capacitor app origin. The current backend permits all CORS origins.

## Local Android development

```bash
cd pdms-frontend
npm ci
npm run mobile:sync
cd android
./gradlew assembleDebug
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

## Release builds

The workflow creates an unsigned-for-store debug APK. Play Store releases need a release build signed with an Android upload key. Keep the keystore and passwords in GitHub Actions secrets, then add a separate signed release workflow when the app is ready to publish.
