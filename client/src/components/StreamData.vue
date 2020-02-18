<template>
  <div>
    <h1>{{ msg }}</h1>
    <StreamDataCard
      v-for="cat in categories"
      :name="cat.name"
      :mainColor="cat.mainColor"
      :value="cat.value"
      :key="cat.id"
    />
    <StreamDataChart :items="cpuLoad"></StreamDataChart>
  </div>
</template>

<script>
import StreamDataCard from "./StreamDataCard";
import StreamDataChart from "./StreamDataChart.vue";

export default {
  name: "StreamData",
  components: { StreamDataChart, StreamDataCard },
  props: {
    msg: String,
    evtPath: String
  },
  data() {
    return {
      items: [],
      evtSource: {},
      categories: [
        {
          id: 1,
          name: "CPU",
          mainColor: "red",
          value: 0
        },
        { id: 2, name: "RAM", mainColor: "blue", value: "12.3/16 Go" },
        { id: 3, name: "Network", mainColor: "green", value: "16.3 MBps" }
      ]
    };
  },
  created: function() {
    let vm = this;
    vm.evtSource = new EventSource(vm.evtPath);
    vm.evtSource.onmessage = function(event) {
      let val = JSON.parse(event.data);
      val.time = new Date(val.time);

      // Push val to items list
      vm.items.push(val);
      if (vm.items.length > 60) {
        vm.items.shift();
      }

      // Push values to DataCards
      vm.categories.forEach(function(cat) {
        switch (cat.name) {
          case "CPU": {
            cat.value = val.cpu_load + " %";
            break;
          }
          case "RAM": {
            cat.value =
              (val.tot - val.free).toFixed(2) +
              "/" +
              val.tot.toFixed(2) +
              " Go";
          }
        }
      });
    };
  },
  computed: {
    cpuLoad: function() {
      return this.items.map(val => Object({ x: val.time, y: val.cpu_load }));
    }
  }
};
</script>

<style></style>
