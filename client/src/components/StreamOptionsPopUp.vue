<template>
  <div class="options">
    <button @click="showForm">Options</button>
    <div v-if="showModal" class="modal-mask">
      <div class="modal-container">
        <h2>Options for monitoring</h2>
        <label
          v-for="option in newOptions"
          :key="option.name"
          :style="{display: option.edit ? 'block': 'none'}"
        >
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
.modal-container button,
.modal-container label {
  align-self: center;
}

.modal-container h2 {
  margin: 0;
}

.modal-container label {
  font-size: 1.3rem;
  margin: 1rem 0;
}

.modal-container input {
  font-size: 1rem;
  max-width: 60px;
  margin-left: 0.5rem;
  -moz-appearance: textfield;
  appearance: textfield;
  margin: 0;
  text-align: center;
}

.modal-container button {
  box-shadow: inset 0px 1px 0px 0px #ffffff;
  background: linear-gradient(to bottom, #ffffff 5%, #f6f6f6 100%);
  background-color: #ffffff;
  border-radius: 6px;
  border: 1px solid #dcdcdc;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: bold;
  padding: 0.5rem 1rem;
  text-decoration: none;
  text-shadow: 0px 1px 0px #ffffff;
}
.modal-container button:hover {
  background: linear-gradient(to bottom, #f6f6f6 5%, #ffffff 100%);
  background-color: #f6f6f6;
}
</style>