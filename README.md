# Jeanrry Loader

A Vue.js SFC loader for translating your app at **compiling** time.

> NOTE: This project is still working in progress. Use at your own risk!!

![CircleCI](https://img.shields.io/circleci/build/github/tychenjiajun/jeanrry-loader/master?style=for-the-badge)
![npm](https://img.shields.io/npm/dw/jeanrry-loader?style=for-the-badge)
![npm (tag)](https://img.shields.io/npm/v/jeanrry-loader/latest?style=for-the-badge)
![NPM](https://img.shields.io/npm/l/jeanrry-loader?style=for-the-badge)

## Installation

Run the following command in your terminal

```bash
npm install jeanrry-loader --save
```

Configure it in your `vue.config.js` file:

```js
// our default translator is frenchkiss
const frenchkiss = require('frenchkiss');

// set up, you can load files here
frenchkiss.set('en', {
  hi: 'Hi!',
  hello: 'Hello, {name}!',
  welcome: 'Welcome to Your {name} App!'
});

// setting the default locale
frenchkiss.locale('en')


module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule('jeanrry-loader')
      .test(/\.vue$/)
      .resourceQuery(/\?vue.*(&type=template).*/)
      .use('jeanrry-loader')
      .loader('jeanrry-loader')
      .options({
        // some options, see the `Loader Options` part in readme file
      });
  },
};
```

## Usage

Jeanrry loader only works on your SFC `*.vue` files!

### Basic Usage

```html
<template>
  <h3>{{ t('hi') }}</h3>
</template>
```

will be compiled to:

```html
<template>
  <h3>{{ 'Hi!' }}</h3>
</template>
```

### Use on component's props or element's attribute

```html
<template>
  <HelloWorld :msg="t('welcome', { name: 'Vue.js' })" />
</template>
```

will be compiled to:

```html
<template>
  <HelloWorld :msg="'Welcome to Your Vue.js App!'" />
</template>
<script>
  // your SFC script part
</script>
```

### Use with your component's data

TBD

## Loader Options

Following is the complete default options

```javascript
{
    translator: frenchkissTranslator, // in jeanrry-loader/dist/translators
}
```

### Translators

TBD

## Building for multiple languages

TBD

## Deployment

There's different flavors of deployment. You can deploy like wikipedia: have different domains `en.example.com`, `zh.example.com` for different locales. Or using different sub-paths `example.com/zh/`, `example.com/en/` like Vue.js official site. Or even using plain [Content-Negotiation](https://tools.ietf.org/html/rfc7231#section-5.3).

Deploying a multi-languages jeanrry compiled Vue.js app to different domains or different sub-paths should be simple as the original Vue.js app. So the following guides/recipes will focus on the content negotiation part. For Vue.js deployment, checkout the [vue-cli docs](https://cli.vuejs.org/guide/deployment.html).

### Netlify

TBD

### Apache HTTP Server

Build your app using the 'Building to the same `dist` folder but have different `index.html`' method mentioned above. Move your built files to the directory of your apache http server. Add `MultiViews` to the `Options` of your directory

```xml
<Directory "/srv/http">
    Options Indexes FollowSymLinks MultiViews
</Directory>
```

and rename your `*.html` files to `index.html.en`, `index.html.zh`, `index.html.jp` etc. Restart your server and using browser with different `Accept-Langauge` header values to see the effectiveness.

For detail config, checkout the [Apache HTTP Server docs](https://httpd.apache.org/docs/current/content-negotiation.html).

### Nginx

TBD

## How it works?

TBD

## Todos

- Integration with more i18n frameworks.
- Add tests.
- Performance optimizations.
