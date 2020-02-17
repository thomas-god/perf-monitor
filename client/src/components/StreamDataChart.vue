<template>
  <div class="small">
    <line-chart :chart-data="chartData" :options="chartOptions"></line-chart>
  </div>
</template>

<script>
import LineChart from "./LineChart.js";

export default {
  components: {
    LineChart
  },
  props: ["items"],
  data() {
    return {
      chartOptions: {
        scales: {
          xAxes: {
            display: true
          }
        },
        animation: {
          duration: 0,
          easing: "linear"
        }
      }
    };
  },
  mounted() {
    this.fillData();
  },
  computed: {
    chartDataX: function() {
      return this.items.map(x => x.time_id);
    },
    chartDataY: function() {
      return this.items.map(x => x.value);
    },
    chartData: function() {
      return {
        labels: this.chartDataX,
        datasets: [
          {
            label: "Monitoring data",
            data: this.chartDataY
          }
        ]
      };
    }
  }
};
</script>

<style>
.small {
  max-width: 600px;
  margin: 150px auto;
}
</style>
