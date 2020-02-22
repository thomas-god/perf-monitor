<template>
  <div class="monitoring">
    <StreamOptionsPopUp :options="monitoringOptions" @options-modified="updateOptions" />
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
import StreamOptionsPopUp from "./StreamOptionsPopUp.vue";

var categories = [
  { name: "CPU", mainColor: "red", value: 0, minValue: 0, maxValue: 100 },
  { name: "RAM", mainColor: "blue", value: 0, minValue: 0, maxValue: 16 }
];

export default {
  name: "StreamData",
  components: { StreamDataChart, StreamDataCard, StreamOptionsPopUp },
  props: {
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
        while (vm.items.length > vm.monitoringOptions.hist.value) {
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
      Monitoring ${this.hostInfos.hostname} (${this.hostInfos.distro} ${this.hostInfos.release})`;
    }
  },
  methods: {
    updateOptions: function(event) {
      this.monitoringOptions = event;
      this.sendUpdatedOptions();
    },
    sendUpdatedOptions: async function() {
      let vm = this;
      let body = { clientID: vm.clientID };
      body.options = {};
      Object.entries(vm.monitoringOptions).forEach(([key, value]) => {
        body.options[key] = value.value;
      });
      fetch("http://localhost:3000/monitoring/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })
        .then(response => response.json())
        .then(({ data, options }) => {
          vm.monitoringOptions = options;
          vm.items.splice(0, vm.items.length);
          data.forEach(val => {
            val.time = new Date(val.time);
            vm.items.push(val);
            while (vm.items.length > vm.monitoringOptions.hist.value) {
              vm.items.shift();
            }
          });
        });
    }
  }
};
</script>

<style>
.monitoring {
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  margin: 0rem 2rem 2rem;
}

.monitoring > h1 {
  font-size: 1.7rem;
  margin-top: 0;
}

.cardsContainer {
  display: flex;
  flex-flow: row wrap;
  justify-content: center;
}
</style>
