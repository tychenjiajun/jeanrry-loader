<template>
    <div title="Hi!">
      Hi!
      <div translate="no" :title="t('hi')">
        {{ t('hi') }}
        <div :title="t('hi')" translate="ggfgfd" >
          {{ t('hi') }}
          <input translate="no" :title="t('hi')" type="text">
          <input translate="yes" title="Hi!" type="text">
          <div :title="yes" translate="yes">
            <input translate="no" :title="t('hi')" type="text">
            <input translate="yes" title="Hi!" type="text">
            <div title="Hi!" translate="ggfgfd" >
              Hi!
            </div>
          </div>
        </div>
        <div :title="t('hi')" translate="no">
          {{ t('hi') }}
          <input :title="t('hi')" translate=no type="text">
          <input title="Hi!" translate=yes type="text">
        </div>
      </div>
      <div :title="t('hi')" translate="no" >
        {{ t('hi') }}
      </div>
    </div>
</template>