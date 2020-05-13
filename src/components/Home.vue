<template>
  <div class="page page--home">
    <div class="home">
      <recent-posts-widget limit="15">Recent Posts</recent-posts-widget>
    </div>
  </div>
</template>

<script>
import RecentPostsWidget from './widgets/RecentPosts.vue';

export default {
  components: {
    RecentPostsWidget,
  },
};
</script>

<style type="postcss">
  .content {
    width: 100%;

    @media screen and (min-width: 768px) {
      float: right;
      max-width: 75%;
    }
  }
</style>
