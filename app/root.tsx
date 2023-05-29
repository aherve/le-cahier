import { LiveReload, Scripts } from '@remix-run/react';

export default function App() {
  return (
    <html lang="en">
      <head></head>
      <body>
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
