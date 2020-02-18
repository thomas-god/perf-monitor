<template>
  <div
    class="dataCard shadow"
    :style="borderStyle"
    v-on:click="$emit('category-changed', options)"
  >
    <h1>{{ options.name }}</h1>
    <p class="whitespaces">{{ options.value }}</p>
  </div>
</template>

<script>
export default {
  props: ["options"],
  computed: {
    borderStyle() {
      return `border-left: 0.25rem solid ${this.options.mainColor}`;
    }
  }
};
</script>

<style>
.dataCard {
  max-width: 300px;
  text-align: left;
  padding: 1rem;
  border-radius: 0.35rem;
  border: 1px solid #e3e6f0;
  margin: 1rem;
}

.dataCard h1 {
  font-size: 1rem;
  margin: 0px auto 0.5rem;
}

.dataCard p {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
  width: 200px;
}

.shadow {
  box-shadow: 0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15) !important;
}

.whitespaces {
  white-space: pre;
}
</style>
