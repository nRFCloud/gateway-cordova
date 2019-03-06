How to connect a gateway to nRF Cloud:

nRF Cloud is built using AWS IoT. A "gateway" is just a "device" in AWS IoT.

There are two steps to get a gateway connected:
1. Create the gateway record
1. Connect using MQTT

#### Create the gateway record

1. The backend API has an endpoint for this: `/tenants/<Tenant ID>/gateways`. 
1. A correctly signed POST to this endpoint will create a device in AWS IoT, assign it an ID and create credentials.
1. The response from this POST will be a JSON object with the necessary fields, including the credentials.

#### Connect using MQTT

There are two choices to connect: sockets or websockets.

The only difference is how security is handled.

For regular sockets, use the credentials created during the "create the gateway record".

For websockets, the url endpoint must be signed using Cognito credentials. This is convenient because the front end uses Cognito for authentication so the credentials from a successful log in can be used here.

1. The URL endpoint for the MQTT device is: `<protocol>://<host>.iot.<region>/amazonaws.com/mqtt`
  1. Example: tls://a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com/mqtt
  1. The websocket url will be different, but will have the same basic form: `wss://a2n7tk1kp18wix-ats.iot.us-east-1.amazonaws.com/mqtt?<signed params>`
1. The "client ID" for the MQTT connection should be set to the gateway id as received earlier
  
#### After connection is successful

There are a couple of topics that are of interest and should be subscribed to immediately:

`$aws/things/<gateway id>/shadow/get/accepted`

`$aws/things/<gateway id>/shadow/update/delta`

`<stage>/<tenant ID>/gateways/<gateway ID>/c2g`

Immediately upon connection, the gateway state can be retreived from the back end by publishing an empty string ('') on the topic:

`$aws/things/<gateway id>/shadow/get`

Anything received over the "shadow" topics should be configuration for the gateway itself. This includes things like "add this bluetooth device" or "rename the gateway to this name".

Anything received over the "c2g" (cloud to gateway) topic is a request from the frontend to do something. Like scan for bluetooth devices, write a characteristic value to a device, etc.

The various messages used in "c2g" and "g2c" (gateway to cloud) are listed in https://github.com/NordicPlayground/nrfcloud-gateway-common/blob/kerr/update-cordova-fixes/schema/g2c.schema.json

All messages are JSON stringified objects.

Any messages received that are not understood should be discarded. This is true of all parts of the system (a malformed message won't take down the system).
