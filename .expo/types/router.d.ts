/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string = string> extends Record<string, unknown> {
      StaticRoutes: `/` | `/(auth)` | `/(auth)/forgot-password` | `/(auth)/login` | `/(auth)/register` | `/(auth)/register-empresa` | `/(auth)/register-select` | `/(tabs)` | `/(tabs)/accounts` | `/(tabs)/home` | `/(tabs)/operations` | `/(tabs)/profile` | `/_sitemap` | `/accounts` | `/accounts/new` | `/forgot-password` | `/home` | `/login` | `/operation/new` | `/operations` | `/profile` | `/register` | `/register-empresa` | `/register-select`;
      DynamicRoutes: `/operation/${Router.SingleRoutePart<T>}`;
      DynamicRouteTemplate: `/operation/[id]`;
    }
  }
}
