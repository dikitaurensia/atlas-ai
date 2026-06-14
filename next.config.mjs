/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['typeorm'],
  webpack: (config) => {
    // TypeORM bundles optional drivers that aren't available — ignore them
    config.resolve.alias = {
      ...config.resolve.alias,
      'expo-sqlite': false,
      'react-native-sqlite-storage': false,
      'mysql': false,
      'mysql2': false,
      'oracledb': false,
      'mssql': false,
      'better-sqlite3': false,
      'sqlite3': false,
      'pg-native': false,
      'mongodb': false,
      'hdb-pool': false,
      '@sap/hana-client': false,
      'sql.js': false,
      'typeorm-aurora-data-api-driver': false,
    }
    return config
  },
}
export default nextConfig
