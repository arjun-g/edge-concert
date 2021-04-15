# Concert Booking

A simple app to demonstrate cloudflare worker features like static site, KV, htmlrewriter, geo location, etc.

## Rendering

### Static files

The static files are present in `public` folder. There are seperate folders for `web` and `mobile`. Based on the user agent the worker serves the respective files.

### Concert data source

For the sake of demo the concert details are generated with random distance from user's location - `workers-site/ds.js` The generated list is stored in worker KV.

### Dynamic Content

Using `HTMLRewriter` the static html content are replaced with dynamic concert details - `workers-site/index.js`