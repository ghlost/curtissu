<template>
  <div class="pt-10">
    <template v-if="allPagesLoaded">
      <h1>{{ pageContent.title.rendered }}</h1>
      <div class="page-content">
        <p class="testing">this is a test</p>
      </div>
    </template>
    <Loader v-else />
  </div>
</template>

<script>
import Loader from '../partials/Loader.vue';
import { mapGetters } from 'vuex';

export default {
  computed: {
    ...mapGetters({
      page: 'page',
      allPagesLoaded: 'allPagesLoaded',
    }),

    pageContent() {
      return this.page(this.$route.params.pageSlug);
    },
  },

  components: {
    Loader,
  },
};
</script>

<style type="scss">
@import '../../../assets/scss/_components/home';
.page-content {
  .testing {
    background: red;
  }
}
</style>
