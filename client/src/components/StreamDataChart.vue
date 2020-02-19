<template>
  <line-chart
    :type="graphType"
    :data="chartData"
    :options="chartOptions"
    class="data-chart"
  />
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
.data-chart {
  margin-top: 2rem;
  align-self: stretch;
  font-size: 1.2rem;
}
</style>
