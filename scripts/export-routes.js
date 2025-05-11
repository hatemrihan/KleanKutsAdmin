const fs = require('fs');
const path = require('path');

// Define the problem routes that need special handling
const problemRoutes = [
  '/orders',
  '/settings'
];

// Create the .next/standalone directory if it doesn't exist
const staticDir = path.join(__dirname, '..', '.next', 'standalone');
if (!fs.existsSync(staticDir)) {
  fs.mkdirSync(staticDir, { recursive: true });
}

// Create HTML files for each problem route
problemRoutes.forEach(route => {
  const routePath = route.substring(1); // Remove leading slash
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Elevee Admin</title>
  <script>
    // This special script ensures Next.js client-side navigation works correctly
    window.__NEXT_ROUTER_BASEPATH = '';
    window.__NEXT_DATA__ = {
      props: { pageProps: {} },
      page: "${route}",
      query: {},
      buildId: ""
    };
    // Don't redirect, just use Next.js's own client-side router
  </script>
</head>
<body>
  <div id="__next">
    <!-- Next.js will hydrate this div -->
    <div>Loading ${routePath} page...</div>
  </div>
  <script src="/_next/static/chunks/main.js" defer></script>
</body>
</html>
  `;

  // Write the HTML file to the correct location
  fs.writeFileSync(path.join(staticDir, `${routePath}.html`), htmlContent);
  console.log(`Created static HTML file for ${route}`);
});

console.log('Static route export completed successfully');
