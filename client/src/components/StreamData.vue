<template>
  <div>
    <h1>{{ msg }}</h1>
    <StreamDataChart :items="items"></StreamDataChart>
  </div>
</template>

<script>
import StreamDataChart from "./StreamDataChart.vue";

export default {
  name: "StreamData",
  components: { StreamDataChart },
  props: {
    msg: String,
    evtPath: String
  },
  data() {
    return {
      items: [],
      evtSource: {}
    };
  },
  created: function() {
    let vm = this;
    vm.evtSource = new EventSource(vm.evtPath);
    vm.evtSource.onmessage = function(event) {
      let val = JSON.parse(event.data);
      val.time = new Date(val.time);
      vm.items.push(val);
      if (vm.items.length > 60) {
        vm.items.shift();
      }
    };
  }
};
</script>

<style></style>
