<template>
  <div>
    {{ 'Last checked: ' + '&#x2068;' + new Intl.DateTimeFormat(['en-US'], { day: 'numeric', month: 'long' }).format(date) + '&#x2069;' + '.' }}
  </div>
</template>
