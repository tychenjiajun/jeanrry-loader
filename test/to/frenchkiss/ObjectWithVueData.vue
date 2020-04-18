<template>
  <div>
    {{ (function(a,f,k,l,v ) { var p=a||{};return "Hello, "+(p["name"]||(p["name"]=="0"?0:"name" in p?"":v("name",k,l)))+"!" })({ name: name }) }}
  </div>
</template>
