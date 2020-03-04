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
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
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
<template jeanrry="zh">
  <h3>t('ecosystem')</h3>
</template>
<jeanrry>
  { "en": { "ecosystem": "Ecosystem" }, "zh": { "ecosystem": "生态系统" } }
</jeanrry>
<script>
  // your SFC script part
</script>
```

will be compiled to:

```html
<template>
  <h3>生态系统</h3>
</template>
<script>
  // your SFC script part
</script>
```

### Use on component's props or element's attribute

```html
<template jeanrry="zh">
  <HelloWorld msg="t('welcome', { name: 'Vue.js' })" />
</template>
<jeanrry>
  { "en": { "welcome": "Welcome to Your {name} App" }, "zh": { "welcome":
  "欢迎来到你的{name}应用" } }
</jeanrry>
<script>
  // your SFC script part
</script>
```

will be compiled to:

```html
<template>
  <HelloWorld msg="欢迎来到你的Vue.js应用" />
</template>
<script>
  // your SFC script part
</script>
```

### Use with your component's data

```html
<template jeanrry="zh">
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld :msg="`t('welcome', { n: '${name}' })`" />
  </div>
</template>

<jeanrry>
  { "en": { "welcome": "Welcome to Your {n} App" }, "zh": { "welcome":
  "欢迎来到你的{n}应用" } }
</jeanrry>

<script>
  import HelloWorld from './components/HelloWorld.vue';

  export default {
    name: 'App',
    components: {
      HelloWorld,
    },
    data() {
      return {
        name: 'Vue.js',
      };
    },
  };
</script>
```

will be compiled to:

```html
<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png" />
    <HelloWorld :msg="`欢迎来到你的${name}应用`" />
  </div>
</template>

<script>
  import HelloWorld from './components/HelloWorld.vue';

  export default {
    name: 'App',
    components: {
      HelloWorld,
    },
    data() {
      return {
        name: 'Vue.js',
      };
    },
  };
</script>
```

And

```html
<template jeanrry="zh">
  <a href="https://github.com/vuejs/vue-devtools#vue-devtools"
    >t('devtools', { n: '{{ name }}'})</a
  >
</template>

<jeanrry>
  {
    "en": {
      "devtools": "{n}-devtools"
    },
    "zh": {
      "devtools": "{n}-开发工具"
    }
  }
</jeanrry>


<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      name: 'vue'
    }
  }
}
</script>
```

will be compiled to:

```html
<template>
  <a href="https://github.com/vuejs/vue-devtools#vue-devtools"
    >{{ name }}-开发工具</a
  >
</template>

<script>
export default {
  name: 'HelloWorld',
  data () {
    return {
      name: 'vue'
    }
  }
}
</script>
```

## Loader Options

Following is the complete default options

```javascript
{
    translator: 'frenchkiss',
    queryName: 'jeanrry',
    blockName: 'jeanrry',
    locale: 'en',
    fallback: 'en',
    functionName: 't',
    remove: true
}
```

### translator

TBD

### queryName

The attribute name of the `template` block. Default is `jeanrry`, recommended to be `i18n`.

```javascript
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('jeanrry-loader')
      .loader('jeanrry-loader')
      .options({
        queryName: 'i18n'
      });
  },
};
```

allows you to write

```html
<template i18n>
    <!-- your SFC template -->
</template>
```

### blockName

The block name of the translation messages. Default is `jeanrry`, recommended to be `i18n`.

```javascript
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('jeanrry-loader')
      .loader('jeanrry-loader')
      .options({
        blockName: 'i18n'
      });
  },
};
```

allows you to write

```html
<i18n>
  {
    "en": {
      "hello": "Hello World"
    }
  }
</i18n>
```

### locale

The global locale of the whole project.

### fallback

The global fallback locale of the whole project.

### functionName

The translate function name.

```javascript
module.exports = {
  chainWebpack: config => {
    config.module
      .rule('vue')
      .use('jeanrry-loader')
      .loader('jeanrry-loader')
      .options({
        functionName: '_t'
      });
  },
};
```

allows you to write


```html
<template>
    <h3>_t('hello')</h3>
</template>
```

### remove

Whether or not to remove the translation messages block after translation. Setting this to `false` may cause the error 'You may need an additional loader to handle the result of these loaders.' thrown by webpack, but also may benefit you on sharing messages between `jeanrry-loader` and `vue-i18n` if you set `blockName` to `i18n` at the same time.

## Building for multiple languages

It's recommend to use [environment variables](https://cli.vuejs.org/guide/mode-and-env.html#environment-variables) to build pages for different locales.

### Building to different destination folders

First, add a file `.env.zh` to your project

```
VUE_APP_JEANRRY_LOCALE=zh
VUE_APP_JEANRRY_OUTPUT_DIR=dist/zh
```

Then use the variables in `vue.config.js`

```js
module.exports = {
    outputDir: process.env.VUE_APP_JEANRRY_OUTPUT_DIR,
    chainWebpack: config => {
        config.module
            .rule('vue')
            .use('cache-loader')
            .loader('cache-loader')
            .tap(options => {
                options.cacheIdentifier = hash([options.cacheIdentifier, process.env.VUE_APP_JEANRRY_LOCALE]) // see issue#2
                return options
            }).end()
            .use('vue-loader')
            .loader('vue-loader')
            .tap(options => {
                options.cacheIdentifier = hash([options.cacheIdentifier, process.env.VUE_APP_JEANRRY_LOCALE]) // see issue#2
                return options
            }).end()
            .use('jeanrry-loader')
            .loader('jeanrry-loader')
            .options({
                locale: process.env.VUE_APP_JEANRRY_LOCALE
            })
    }
}
```

Correctly set your `lang` in `public/index.html`

```html
<!DOCTYPE html>
<html lang="<%= VUE_APP_JEANRRY_LOCALE %>">
  <!-- your html content -->
</html>
```

Finally, add a script `zh` (or other name you like) in your `package.json` and run it

```js
{
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "npm run zh & npm run en",
    "lint": "vue-cli-service lint",
    "zh": "vue-cli-service build --mode zh",
    "en": "vue-cli-service build --mode en"
  }
}
```

```bash
npm run zh # will build your file in locale `zh` in `dish/zh`

# or

npm run build # will build both locales files
```

### Building to the same `dist` folder but have different `index.html`

This way is recommended if you have shared favicon, image and css files.

First, add a file `.env.zh` to your project

```
VUE_APP_JEANRRY_LOCALE=zh
```

Then use the variables in `vue.config.js`

```js
module.exports = {
    indexPath: process.env.VUE_APP_JEANRRY_LOCALE + '.html', // the only different place compared to the previous method
    chainWebpack: config => {
        config.module
            .rule('vue')
            .use('cache-loader')
            .loader('cache-loader')
            .tap(options => {
                options.cacheIdentifier = hash([options.cacheIdentifier, process.env.VUE_APP_JEANRRY_LOCALE]) // see issue#2
                return options
            }).end()
            .use('vue-loader')
            .loader('vue-loader')
            .tap(options => {
                options.cacheIdentifier = hash([options.cacheIdentifier, process.env.VUE_APP_JEANRRY_LOCALE]) // see issue#2
                return options
            }).end()
            .use('jeanrry-loader')
            .loader('jeanrry-loader')
            .options({
                locale: process.env.VUE_APP_JEANRRY_LOCALE
            })
    }
}
```

Correctly set your `lang` in `public/index.html`

```html
<!DOCTYPE html>
<html lang="<%= VUE_APP_JEANRRY_LOCALE %>">
  <!-- your html content -->
</html>
```

Finally, add a script `zh` (or other name you like) in your `package.json` and run it. Dont' forget the `--no-clean` option!

```js
{
  "scripts": {
    "serve": "vue-cli-service serve",
    "build": "npm run zh & npm run en",
    "lint": "vue-cli-service lint",
    "zh": "vue-cli-service build --mode zh --no-clean",
    "en": "vue-cli-service build --mode en --no-clean"
  }
}
```

```bash
npm run zh # will build your file in locale `zh` in `dish/zh`

# or

npm run build # will build both locales files
```

Your `dist` will have two `.html` files, `zh.html` is the entry of the Chinese version and `en.html` is the entry of the English version.

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

## How it works? How to do pluralization?

Unlike other i18n tools. Jeanrry loader translate at building time.

When you are building your Vue.js apps, jeanrry loader search all the `*.vue` files, load the json from `<jeanrry>` block and set it with `frenchkiss.set()` and find the translate function (`t()`, or your custom name set in loader options) and execute it with `frenchkiss.t()`. You can checkout the [frenchkiss.js](https://github.com/koala-interactive/frenchkiss.js) project to explore more usage.

## Todos

* Integration with more i18n frameworks.
* Allowing custom block name and custom attribute name on `<template>`.
* Support pluralization.
* Add global setting.
* Add tests.
