<template>
  <div class="page page--home">
    <h1>The Hotdrop</h1>
    <recent-posts-widget limit="5" class="mb-10">Recent Posts</recent-posts-widget>
    <pages-widget limit="5">Pages</pages-widget>
  </div>
</template>

<script>
import RecentPostsWidget from './widgets/RecentPosts.vue';
import PagesWidget from './widgets/Pages.vue';

export default {
  components: {
    RecentPostsWidget,
    PagesWidget,
  },
};
</script>

<style type="postcss"></style>
