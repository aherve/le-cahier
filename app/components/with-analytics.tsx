import type { ReactNode } from 'react';

import { useAuthenticator } from '@aws-amplify/ui-react';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';

export function WithAnalytics(props: { children: ReactNode }) {
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (!user.username) {
      return;
    }
    if (mixpanel.config) {
      mixpanel.identify(user.username);
      mixpanel.people.set('$name', user.username);
    }
  }, [user.username]);

  return <>{props.children}</>;
}
