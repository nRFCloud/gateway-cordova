This is a Cordova app that implements everything required to run a gateway to connect to nRF Cloud.

Pre-reqs:

1. Have NodeJS and npm installed
1. Cordova installed. This should be as simple as `npm i -g cordova`
1. This repo.
1. Copy the `.env.sample` file to `.env` and fill out details if you'd like to auto-fill your username and password
1. Copy the sample file in `./config` to `keystore.json`. Fill out the information if you have it.
1. Checkout the [gateway-common](https://github.com/nRFCloud/gateway-common) repo into the parent directory (so it can satisfy the dependency in package.json.)
    1. Make sure you `npm i` and `npm run build` in the gateway directory

Steps to build:

1. `npm i` (only needed on first build)
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


##### To build for production

There's a couple of Gulp tasks to make this a bit easier. 

**Warning:** these tasks will revert any uncommited changes to config.xml. Be sure you are okay with this before you run the tasks.

**Android** - Task: `buildAndroid`

Before running this task, make sure you copy `keystore.sample.json` to `keystore.json` and fill out the details. Be sure not to accidentally check in this file or the keystore itself.

This task will ask for the store and alias passwords. These will be used to build the production APK.

After a successful build, there will be two files in the `built` folder. One for staging and one for production. Use the production one to create the update on the app store.


**iOS** - Task: `buildIos`

This task is more straight-forward than Android simply because you're stuck using Xcode for the final steps instead of a command-line tool. After running this task, open the project (./platforms/ios) in Xcode and follow the normal deploy process for iOS apps through Xcode.
