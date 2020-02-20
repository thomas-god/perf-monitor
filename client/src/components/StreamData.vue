<template>
  <div class="monitoring">
    <h1>{{ welcomeMsg }}</h1>
    <div class="cardsContainer">
      <StreamDataCard
        v-for="cat in categories"
        :options="cat"
        :key="cat.name"
        v-on:category-changed="currentCategory = $event"
      />
    </div>

    <StreamDataChart :items="currentData" :category="currentCategory"></StreamDataChart>
  </div>
</template>

<script>
import StreamDataCard from "./StreamDataCard";
import StreamDataChart from "./StreamDataChart.vue";

var categories = [
  { name: "CPU", mainColor: "red", value: 0, minValue: 0, maxValue: 100 },
  { name: "RAM", mainColor: "blue", value: 0, minValue: 0, maxValue: 16 }
];

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
      categories: categories,
      currentCategory: categories[0],
      hostInfos: {},
      clientID: "",
      monitoringOptions: {}
    };
  },
  created: function() {
    let vm = this;
    vm.evtSource = new EventSource(vm.evtPath);
    vm.evtSource.addEventListener("data", function(event) {
      let values = JSON.parse(event.data);
      values.forEach(val => {
        val.time = new Date(val.time);

        // Push val to items list
        vm.items.push(val);
        if (vm.items.length > 60) {
          vm.items.shift();
        }
      });

      // Push last value to DataCards
      let last_val = vm.items[vm.items.length - 1];
      vm.categories.forEach(function(cat) {
        switch (cat.name) {
          case "CPU": {
            cat.value = last_val.cpu_load.toFixed(2).padStart(6) + " %";
            break;
          }
          case "RAM": {
            cat.value =
              (last_val.tot - last_val.free).toFixed(2).padStart(5) +
              "/" +
              last_val.tot.toFixed(2) +
              " Go";
            break;
          }
        }
      });
    });
    vm.evtSource.addEventListener("hostinfos", function(event) {
      let infos = JSON.parse(event.data);
      console.log(infos);
      vm.hostInfos = infos.hostInfos;
      vm.clientID = infos.clientID;
      vm.monitoringOptions = infos.options;
    });
  },
  computed: {
    currentData: function() {
      let data;
      switch (this.currentCategory.name) {
        case "CPU":
          data = this.items.map(val =>
            Object({ x: val.time, y: val.cpu_load })
          );
          break;
        case "RAM":
          data = this.items.map(val =>
            Object({ x: val.time, y: val.tot - val.free })
          );
          break;
      }
      return data;
    },
    welcomeMsg: function() {
      return `
      Monitoring data from ${this.hostInfos.hostname} (${this.hostInfos.distro} ${this.hostInfos.release})`;
    }
  }
};
</script>

<style>
.monitoring {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  margin: 2rem;
}

.cardsContainer {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
}
</style>
