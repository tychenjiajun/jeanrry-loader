<template>
  <div>
    {{ ('0.0') === (new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score)) ? ('You scored zero points. What happened?') : ('other') === (new Intl.PluralRules(['en-US'], { minimumFractionDigits: 1 }).select(new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score))) ? ('You scored ' + '&#x2068;' + new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score) + '&#x2069;' + ' points.') : ('You scored ' + '&#x2068;' + new Intl.NumberFormat(['en-US'], { minimumFractionDigits: 1 }).format(score) + '&#x2069;' + ' points.') }}
  </div>
</template>
