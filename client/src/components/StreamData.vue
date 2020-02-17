<template>
  <div>
    <h1>{{ msg }}</h1>
    <ul>
      <li v-for="item in items" :key="item.time_id">{{ item.time_id }}</li>
    </ul>
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
      val.value = Math.random();
      vm.items.push(val);
      if (vm.items.length > 10) {
        vm.items.shift();
      }
    };
  }
};
</script>

<style></style>
