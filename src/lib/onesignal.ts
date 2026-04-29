import {
  createConfiguration,
  DefaultApi,
  type Notification,
} from "@onesignal/node-onesignal";

const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

if (!appId || !restApiKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_ONESIGNAL_APP_ID y ONESIGNAL_REST_API_KEY para OneSignal."
  );
}

const client = new DefaultApi(
  createConfiguration({
    restApiKey,
  })
);

export async function sendNotification(
  userId: string,
  title: string,
  message: string,
  url?: string
) {
  const body: Notification = {
    app_id: appId,
    include_subscription_ids: [userId],
    target_channel: "push",
    headings: { en: title, es: title },
    contents: { en: message, es: message },
    url,
  };
  return client.createNotification(body);
}

export async function scheduleNotification(
  userId: string,
  title: string,
  message: string,
  sendAfter: string
) {
  const body: Notification = {
    app_id: appId,
    include_subscription_ids: [userId],
    target_channel: "push",
    headings: { en: title, es: title },
    contents: { en: message, es: message },
    send_after: sendAfter,
  };
  return client.createNotification(body);
}
