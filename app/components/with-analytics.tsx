import type { ReactNode } from 'react';

import { useAuthenticator } from '@aws-amplify/ui-react';
import mixpanel from 'mixpanel-browser';
import { useEffect } from 'react';

export function WithAnalytics(props: { children: ReactNode }) {
  const { user } = useAuthenticator((context) => [context.user]);
  useEffect(() => {
    mixpanel.identify(user.attributes?.sub);
  }, [user.attributes?.sub]);

  return <>{props.children}</>;
}
