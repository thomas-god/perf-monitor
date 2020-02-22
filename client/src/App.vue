<template>
  <div id="app">
    <StreamData evtPath="http://localhost:3000/monitoring" />
  </div>
</template>

<script>
import StreamData from "./components/StreamData.vue";

export default {
  name: "App",
  components: {
    StreamData
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
