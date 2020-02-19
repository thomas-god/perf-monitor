<template>
  <line-chart :type="graphType" :data="chartData" :options="chartOptions" />
</template>

<script>
import LineChart from "./LineChart.vue";

export default {
  components: {
    LineChart
  },
  data() {
    return {
      graphType: "line"
    };
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
            borderColor: this.category.mainColor,
            pointRadius: 0
          }
        ]
      };
    },
    chartOptions() {
      return {
        maintainAspectRatio: false,
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
