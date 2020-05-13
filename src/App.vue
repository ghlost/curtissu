<template>
  <div class="app"
    :class="{'app--menu-open': menuOpen}">
    <svgs/>
    <transition name="toggle">
      <navigation :isShown="menuOpen" v-show="menuOpen"/>
    </transition>
    <app-header :isShown="menuOpen" v-on:toggle-menu="toggleMenu"/>

    <transition name="loader-animation" enter-active-class="animated fadeIn" leave-active-class="animated fadeOut">
      <progress-bar :show-loader="showLoader" :loader-style="loaderStyle" />
    </transition>

    <transition name="page-transition" mode="out-in" appear>
      <main class="content">
        <router-view></router-view>
      </main>
    </transition>

    <app-footer />
  </div>
</template>

<script>
import { mapGetters, mapActions, mapMutations } from 'vuex';
import Svgs from './components/partials/Svgs.vue';
import Navigation from './components/partials/Navigation.vue';
import Header from './components/partials/Header.vue';
import Footer from './components/partials/Footer.vue';
import ProgressBar from './components/partials/ProgressBar.vue';

export default {
  data() {
    return {
      showLoader: true,
      menuOpen: false,
    };
  },
  computed: {
    ...mapGetters({
      isLoading: 'isLoading',
      loadingProgress: 'loadingProgress',
    }),

    loaderStyle() {
      return `width: ${this.loadingProgress}%;`;
    },
  },

  components: {
    appHeader: Header,
    appFooter: Footer,
    Navigation,
    ProgressBar,
    Svgs,
  },

  methods: {
    toggleMenu: function() {
      this.menuOpen = !this.menuOpen;
    }
  },

  watch: {
    // watch the value of isLoading and once it's false hide the loader
    isLoading(val) {
      if (val == false) {
        let self = this;
        setTimeout(function() {
          self.showLoader = false;
        }, 1000);
      }
    },
  },
};
</script>

<style type="postcss">
body {
  font-family: 'SegoeUI', sans-serif;
}

.app {
  transform: translateX(0);
  transition: transform 0.5s ease-in-out;

  &--menu-open {
    transform: translateX(-533px);
  }
}
</style>
