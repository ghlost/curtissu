<template>
  <section class="project-grid">
    <div class="project-grid__inner" v-if="recentPostsLoaded">
      <figure class="project" v-for="(post) in recentPosts(limit)" :key="post.id">
        <!-- <router-link v-if="index === 2" to="/about-us" tag="a" class="project__link">
          <img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image">
          <figcaption class="project__name">About Us</figcaption>
        </router-link>
        <router-link v-if="index === 2" to="/contact-us" tag="a" class="project__link">
          <img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image">
          <figcaption class="project__name">Contact Us</figcaption>
        </router-link> -->
        <router-link :to="post.slug" tag="a" class="project__link">
          <img :src="post.featured_image_src" alt="project name" class="project__image">
          <figcaption class="project__name">{{ post.title.rendered }}</figcaption>
        </router-link>
      </figure>
    </div>
    <div v-else>Loading...</div>
  </section>
</template>

<script>
import { mapGetters } from 'vuex';
import matcha from '../../assets/img/matcha.png';

export default {
  props: ['limit'],
  computed: {
    ...mapGetters({
      recentPosts: 'recentPosts',
      recentPostsLoaded: 'recentPostsLoaded',
    }),
  },

  methods: {
    getAuthor(post) {
      console.log(post);
    },
  },

  mounted() {
    this.$store.dispatch('getPosts', { limit: this.limit });
  },
};
</script>

<style type="postcss">
  .project-grid {
    max-width: 100%;

    &__inner {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  .project {
    &__image {
      filter: grayscale(1);
      transition: filter 0.1s ease-in-out;
    }

    &__link {
      text-decoration: none;

      &:hover {
        text-decoration: none;

        .project__image {
          filter: grayscale(0);
        }

        .project__name {
          opacity: 1;
        }
      }
    }
    &__name {
      color: #000;
      font-size: 16px;
      opacity: 0;
      text-align: center;
      transition: opacity 0.1s ease-in-out;

      @media screen and (min-width) {
        font-size: 18px;
      }
    }
  }
</style>
