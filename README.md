# Jeanrry Loader

A Vue.js SFC loader for translating your app at **building** time.

> NOTE: This project is still working in progress. Use at your own risk!!

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
      .loader('jeanrry-loader');
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

## How it works? How to do pluralization?

Unlike other i18n tools. Jeanrry loader translate at building time.

When you are building your Vue.js apps, jeanrry loader search all the `*.vue` files, load the json from `<jeanrry>` block and set it with `frenchkiss.set()` and find the translate function `t()` and execute it with `frenchkiss.t()`. You can checkout the [frenchkiss.js](https://github.com/koala-interactive/frenchkiss.js) project to explore more usage.

## Todos

* Integration with more i18n frameworks.
* Allowing custom block name and custom attribute name on `<template>`.
* Support pluralization.
* Add global setting.
* Add tests.
