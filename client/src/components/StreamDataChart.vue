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
  props: ["items", "category"],
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
            label: this.category.name,
            data: this.chartDataY,
            borderColor: this.category.mainColor
          }
        ]
      };
    },
    chartOptions() {
      return {
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
                suggestedMin: this.category.minValue,
                suggestedMax: this.category.maxValue
              }
            }
          ]
        },
        animation: {
          duration: 0,
          easing: "linear"
        }
      };
    }
  }
};
</script>

<style>
.small {
  max-width: 700px;
  max-height: 300px;
}
</style>
