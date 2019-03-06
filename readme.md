This is a Cordova app that implements everything required to run a gateway to connect to nRF Cloud.

Pre-reqs:
1. Have NodeJS and npm installed
1. Cordova installed. This should be as simple as `npm i -g cordova`
1. This repo, obviously.
1. Copy the `.env.sample` file to `.env` and fill out details if you'd like to auto-fill your username and password
1. Checkout the [gateway-common](https://github.com/nRFCloud/gateway-common) repo into the parent directory (so it can satisfy the dependency in package.json.)
    1. Make sure you `npm i` and `npm run build` in the gateway directory

Not required for building, but required for deployment:
1. Microsoft AppCenter/CodePush. This is used to push updates to the apps that don't have to go through the app store process.

Steps to build:
1. `npm i` (only needed once, of couse)
1. `npm run build`

To test locally (in a browser):
1. `npm run watch`

##### To build and run on your phone:
This is tricky. The easiest environment for this is Android. 

Follow the ["Create your first app"](https://cordova.apache.org/docs/en/latest/guide/cli/index.html) guide on Cordova's website.

You'll need to also follow the platform guide for the platform you're building for. For example, the [Android platform guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html).

Probably the easiest shortcut is to install [Android Studio](https://developer.android.com/studio/). You don't really need the whole studio, but it's a nice and easy package.

Once you think you've got everything installed, you can test:
1. `cordova platform add android`
1. `cordova requirements`

Once everything is a-okay, you can do the following:
1. `npm run build` (if you haven't yet)
1. `cordova build android`

It should successfully build the Android app.

You can use `cordova run android` to build and automatically install it on your phone. Make sure that your phone is detected correctly by running `adb devices` before doing this. Otherwise it will try to start an emulator.

