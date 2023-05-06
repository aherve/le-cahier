declare global {
  interface Window {
    gtag: (
      option: string,
      gaTrackingId: string,
      options: Record<string, unknown>,
    ) => void;
  }
}

/**
 * @example
 * https://developers.google.com/analytics/devguides/collection/gtagjs/pages
 */
export const gaPageView = (url: string, trackingId: string) => {
  if (!window.gtag) {
    console.warn(
      'window.gtag is not defined. This could mean your google analytics script has not loaded on the page yet.',
    );
    return;
  }
  console.log('pageview, yay');
  window.gtag('config', trackingId, {
    page_path: url,
  });
};

/**
 * @example
 * https://developers.google.com/analytics/devguides/collection/gtagjs/events
 */
export const gaEvent = ({
  action,
  category,
  label,
  value,
}: Record<string, string>) => {
  if (!window.gtag) {
    console.warn('window.gtag is not defined.');
    return;
  }
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};
