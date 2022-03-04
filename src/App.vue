<template>
  <div id="app">
    <Sudoku />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import Sudoku from './components/Sudoku.vue';

@Component({
  components: {
    Sudoku,
  },
})
export default class App extends Vue {
}

// FhPyjwQx8JJRMHFvNznwETKQXwUzNPGGnxkWFw==
</script>


<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

@media print {
  .no-print, .no-print * {
    display: none !important;
  }
}
</style>