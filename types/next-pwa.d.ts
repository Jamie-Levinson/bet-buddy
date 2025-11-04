declare module "next-pwa" {
  import { NextConfig } from "next";
  
  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
  }
  
  function withPWA(config: PWAConfig): (config: NextConfig) => NextConfig;
  
  export default withPWA;
}

