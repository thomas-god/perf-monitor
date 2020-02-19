<template>
  <div class="div-chart">
    <canvas ref="chart"></canvas>
  </div>
</template>

<script>
import Chart from "chart.js";

export default {
  name: "LineChart",
  props: ["type", "options", "divStyle", "data"],
  mounted() {
    this.createChart();
  },
  data() {
    return {
      chart: {}
    };
  },
  methods: {
    createChart() {
      const ctx = this.$refs.chart;
      this.chart = new Chart(ctx, {
        type: this.type,
        data: this.data,
        options: this.options
      });
    },
    updateChart() {
      this.chart.clear();
      this.chart.data = this.data;
      this.chart.options = this.options;
      this.chart.update();
    }
  },
  watch: {
    data: {
      handler: function() {
        this.updateChart();
      },
      deep: false
    }
  }
};
</script>

<style>
.div-chart {
  height: 500px;
}
</style>
