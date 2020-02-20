<template>
  <div class="options">
    <button @click="showForm">Options</button>
    <div v-if="showModal" class="modal-mask">
      <div class="modal-container">
        <h2>Options for monitoring</h2>
        <label v-for="option in newOptions" :key="option.name">
          {{ option.text + " (" + option.unit + ")"}}
          <input
            :ref="option.name"
            type="number"
            v-model="option.value"
          />
        </label>
        <button @click="validateForm">Save</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: ["options"],
  methods: {
    showForm: function() {
      this.newOptions = JSON.parse(JSON.stringify(this.options));
      this.showModal = true;
    },
    validateForm: function() {
      for (let option of Object.values(this.newOptions)) {
        option.value = Number(option.value);
      }
      this.$emit("options-modified", this.newOptions);
      this.showModal = false;
    }
  },
  data() {
    return {
      showModal: false,
      newOptions: {}
    };
  }
};
</script>

<style>
.options {
  align-self: flex-end;
}
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
  transition: opacity 0.1s ease;
}
.modal-container {
  width: 60%;
  max-width: 500px;
  margin: 3rem auto;
  padding: 20px 30px;
  background-color: #fff;
  border-radius: 2px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  transition: all 0.1s ease;
  display: flex;
  flex-flow: column nowrap;
  align-items: flex-start;
}

.modal-container h2,
.modal-container button {
  align-self: center;
}
</style>