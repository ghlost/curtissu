<template>
  <div class="page page--home">
    <div class="home">
      <project-grid />
    </div>
  </div>
</template>

<script>
import ProjectGrid from './widgets/ProjectGrid.vue';

export default {
  components: {
    ProjectGrid,
  },
};
</script>

<style type="postcss">
  .content {
    float: right;
    max-width: 75%;
  }
</style>
