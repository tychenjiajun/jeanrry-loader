# Jeanrry Loader

A Vue.js SFC loader for localizing your app at **building** time.

> NOTE: This project is still working in progress. Use at your own risk!!

[![CircleCI](https://img.shields.io/circleci/build/github/tychenjiajun/jeanrry-loader/master?style=for-the-badge)](https://circleci.com/gh/tychenjiajun/jeanrry-loader)
[![npm](https://img.shields.io/npm/dw/jeanrry-loader?style=for-the-badge)](https://www.npmjs.com/package/jeanrry-loader)
[![npm (tag)](https://img.shields.io/npm/v/jeanrry-loader/latest?style=for-the-badge)](https://www.npmjs.com/package/jeanrry-loader)
![NPM](https://img.shields.io/npm/l/jeanrry-loader?style=for-the-badge)
![](https://img.shields.io/badge/dependencies-none-brightgreen.svg?style=for-the-badge)
[![CodeFactor](https://www.codefactor.io/repository/github/tychenjiajun/jeanrry-loader/badge)](https://www.codefactor.io/repository/github/tychenjiajun/jeanrry-loader/badge?style=for-the-badge)

## Features

* Localizing your component's template
* SSR compatible
* Use your favorite i18n/l10n frameworks, no need to learn new syntax
* Safe and fast

## Supported I18n/L10n Frameworks

* [frenchkiss.js](#frenchkiss-translator)
* [Project Fluent](#fluent-translator)

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

### Use on component's props or element's attribute

```html
<template>
  <HelloWorld :msg="t('welcome', { name: 'Vue.js' })" />
</template>
```

### Use with your component's data

```html
<template>
  <HelloWorld :msg="t('welcome', { name: name })" />
</template>
```

### Use the [`translate`](https://html.spec.whatwg.org/multipage/dom.html#the-translate-attribute) attribute

```html
<template>
  <HelloWorld :msg="t('welcome', { name: name })" translate=no> <!-- will not be translate --->
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

If you want to use `$t` instead of `t`:

```javascript
import FluentTranslator from "jeanrry-loader/dist/translators/fluent-translator;"

FluentTranslator.functionNameMappings = { '$t' : 't' }
```

## Translators

Jeanrry Loader doesn't define any new format or syntax of i18n/l10n. Instead, it use other existing i18n/l10n frameworks to translate. Translators in jeanrry loader is the bridge connecting the i18n/l10n frameworks and the loader.

### [Frenchkiss]((https://github.com/koala-interactive/frenchkiss.js)) Translator

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

### [Fluent](https://projectfluent.org/) Translator

Gives you the ability to use [Fluent](https://projectfluent.org/), a localization system
for natural-sounding translations. The translator relies on [`@fluent/bundle`](https://projectfluent.org/fluent.js/bundle/index.html)

#### Installation

```bash
npm install @fluent/bundle --save
# or
yarn add @fluent/bundle
```

#### Setup

```js
import {FluentBundle, FluentResource} from "@fluent/bundle";
import FluentTranslator from "jeanrry-loader/dist/translators/fluent-translator;

let resource = new FluentResource(`
-brand-name = Foo 3000
welcome = Welcome, {$name}, to {-brand-name}!
`);

let bundle = new FluentBundle("en-US");
let errors = bundle.addResource(resource);
if (errors.length) {
    // Syntax errors are per-message and don't break the whole resource
}

FluentTranslator.bundle = bundle; // important

module.exports = {
  chainWebpack: (config) => {
    config.module
      .rule('jeanrry-loader')
      .test(/\.vue$/)
      .resourceQuery(/\?vue.*(&type=template).*/)
      .use('jeanrry-loader')
      .loader('jeanrry-loader')
      .options({
          translator: FluentTranslator
      });
  },
};
```

#### Usage

```html
<template>
  <p>{{ t('welcome' { name: 'Anna' }) }}</p> <!-- Welcome, Anna, to Foo 3000! -->
</template>
```

#### APIs

##### `t(id: string, args?: Record<string, string | NativeArgument>): string`

- `id` can only be a string literal, or the function won't be call. Same as `id` in [`FluentBundle.getMessage(id)`](https://projectfluent.org/fluent.js/bundle/classes/fluentbundle.html#getmessage)
- `args` Same as `args` in [`FluentBundle.formatPattern(pattern, args)`](https://projectfluent.org/fluent.js/bundle/classes/fluentbundle.html#formatpattern) except that it doesn't support [FluentType](https://projectfluent.org/fluent.js/bundle/classes/fluenttype.html) to be the record value.

The return value can be a string literal or a string wrapped function call like `('0.0') === (new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score)) ? ('You scored zero points. What happened?') : ('other') === (new Intl.PluralRules(['en-US'], { minimumFractionDigits: 1 }).select(new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score))) ? ('You scored ' + '&#x2068;' + new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score) + '&#x2069;' + ' points.') : ('You scored ' + '&#x2068;' + new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score) + '&#x2069;' + ' points.')`

## How it works?

Unlike Vue-i18n or other i18n frameworks that runs in browser runtime, Jeanrry Loader run as a Vue `*.vue` files pre-processor on your own machine. It find the **translation expression** in your `*.vue` files and translate them before the Vue compiling. For example,

```html
<template>
  <HelloWorld :msg="t('welcome', { name: name })" />
</template>
```

will be "translated" to:

```html
<template>
  <HelloWorld :msg="(function(a,f,k,l,v ) { var p=a||{};return 'Hello, '+(p['name']||(p['name']=='0'?0:'name' in p?'':v('name',k,l)))+'!' })({ name: name })" />
</template>
```

And the Vue compiler will see the translated `<template>`. But this process also brings the following limitations.

## Limitations

Directly using double quotes in your translator settings will cause unexpected errors. For example, in frenchkiss:

```js
frenchkiss.set('en', {
  quot: '"'
});
```

will cause unexpected error, you should use escape instead

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

## Todos

- [`lang`](https://html.spec.whatwg.org/multipage/dom.html#attr-lang) attribute support
- `v-for` support (maybe)
- Add tests.
- Performance optimizations.

## Licenses

`fluent-translator.ts` and it's compiled files are released in Apache-2.0 license. `frenchkiss-translator.ts` and it's compiled files are released in MIT license. The rests are released in GPL-2.0 license.
