# Jeanrry Loader

A Vue.js SFC loader for localizing your app at **building** time..

> NOTE: This project is still working in progress. Use at your own risk!!

![CircleCI](https://img.shields.io/circleci/build/github/tychenjiajun/jeanrry-loader/master?style=for-the-badge)
![npm](https://img.shields.io/npm/dw/jeanrry-loader?style=for-the-badge)
![npm (tag)](https://img.shields.io/npm/v/jeanrry-loader/latest?style=for-the-badge)
![NPM](https://img.shields.io/npm/l/jeanrry-loader?style=for-the-badge)

## Installation

Run the following command in your terminal

```bash
npm install jeanrry-loader --save
# or
yarn add jeanrry-loader 

# to use jeanrry loader, you should also install one of our supported i18n/l10n frameworks. currently we only support frenchkiss
npm install frenchkiss --save
# or
yarn add frenchkiss
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

> Jeanrry loader only works on your SFC `*.vue` files!

> Following usage examples are based on [frenchkiss](https://github.com/koala-interactive/frenchkiss.js). The `t` function call is nearly the same as [`frenchkiss.t`](https://github.com/koala-interactive/frenchkiss.js#frenchkisstkey-string-params-object-lang-string-string)

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
```

### Use with your component's data

```html
<template>
  <HelloWorld :msg="t('welcome', { name: name })" />
</template>
```

will be compiled to:

```html
<template>
  <HelloWorld :msg="(function(a,f,k,l,v ) { var p=a||{};return 'Hello, '+(p['name']||(p['name']=='0'?0:'name' in p?'':v('name',k,l)))+'!' })({ name: name })" />
</template>
```

Goes to the [translators](#translators) part to see the apis of the translators.

## Loader Options

Following is the complete default options

```javascript
{
    translator: frenchkissTranslator, // in jeanrry-loader/dist/translators
}
```

## Translators

### Frenchkiss Translator

The default translator for jeanrry loader.

#### Installation

```bash
npm install frenchkiss --save
# or
yarn add frenchkiss
```

#### Setup

You can call any functions from [frenchkiss](https://github.com/koala-interactive/frenchkiss.js#-documentation) except for the followings:

- [`frenchkiss.onMissingVariable(fn: Function)`](https://github.com/koala-interactive/frenchkiss.js#frenchkissonmissingvariablefn-function): you should let Vue to do it in browser runtime.
- [`frenchkiss.plural(lang: string, fn: Function)`](https://github.com/koala-interactive/frenchkiss.js#plural-category): currently not supported, use plural expression instead.

Following functions should be called carefully:

- [`frenchkiss.onMissingKey(missingKeyHandler: Function)`](https://github.com/koala-interactive/frenchkiss.js#frenchkissonmissingkeyfn-function): when an [`Error`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error) thrown from the `missingKeyHandler`, your corresponding `t()` won't be called by the jeanrry loader. This is useful if you have a `t` function in your Vue instance and you want Vue to call it.

A typical setup should be like the following. Make sure they're called before the webpack running.

```js
const frenchkiss = require('frenchkiss');

// set up, you can load files here
frenchkiss.set('en', {
  hi: 'Hi!',
  hello: 'Hello, {name}!',
  welcome: 'Welcome to Your {name} App!'
});

// setting the default locale
frenchkiss.locale('en')
```

#### APIs

##### `t(key: string, params?: object, lang?: string): string`

The parameters are nearly the same as [`frenchkiss.t`](https://github.com/koala-interactive/frenchkiss.js#frenchkisstkey-string-params-object-lang-string-string) except for the following:

- `key` can only be a string literal, or the function won't be call
- `lang` can only be a string literal

The return value can be a string literal or a string wrapped function call like `(function(a,f,k,l,v ) { var p=a||{};return 'Hello, '+(p['name']||(p['name']=='0'?0:'name' in p?'':v('name',k,l)))+'!' })({ name: name })`

## Limitations

You should not include double quotes in your translator settings. For example, in frenchkiss:

```js
frenchkiss.set('en', {
  quot: '"'
});
```

may cause unexpected error, you should use escape instead

```js
frenchkiss.set('en', {
  quot: '&quot;'
});
```

Characters like `<` and `>` are also recommended to be used in escape form `&lt;` and `&gt;`

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
