import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // @ts-ignore -- allowedDevOrigins is a new feature not yet in the types
    allowedDevOrigins: [
      'accounts.google.com',
      'oauth2.googleapis.com'
    ]
  }
};

export default nextConfig;
