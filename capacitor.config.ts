import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.minelifeplayz.bedrockcreatorstudio",
  appName: "Bedrock Creator Studio",
  webDir: "dist",
  backgroundColor: "#0a0a0c",
  android: {
    allowMixedContent: false
  }
};

export default config;
