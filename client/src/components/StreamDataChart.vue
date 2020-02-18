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
          xAxes: [
            {
              display: true,
              ticks: {
                maxTicksLimit: 10,
                autoSkip: true
              }
            }
          ],
          yAxes: [
            {
              ticks: {
                suggestedMin: 0,
                suggestedMax: 100
              }
            }
          ]
        },
        animation: {
          duration: 0,
          easing: "linear"
        }
      }
    };
  },
  computed: {
    chartDataX: function() {
      return this.items.map(val => val.x.toLocaleTimeString());
    },
    chartDataY: function() {
      return this.items.map(val => val.y);
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
