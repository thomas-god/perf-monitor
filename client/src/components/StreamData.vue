<template>
  <div>
    <h1>{{ msg }}</h1>
    <ul>
      <li v-for="item in items" :key="item.time_id">{{ item.time_id }}</li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "StreamData",
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
      vm.items.push(JSON.parse(event.data));
      if (vm.items.length > 10) {
        vm.items.shift();
      }
    };
  }
};
</script>

<style></style>
