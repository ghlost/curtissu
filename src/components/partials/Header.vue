<template>
  <nav class="nav">
    <div class="logo">
      <h1 class="logo__wrapper"><a href="/" class="logo__link"><img src="/wp-content/themes/curtissu/dist/img/logo@2x.png" alt="" class="logo__image"></a></h1>
    </div>
    <div class="hamburger">
      <a href="#" class="hamburger__wrapper"
        :class="{'hamburger__wrapper--active': isShown}"
        @click.prevent="showMenu">
        <div class="hamburger__box">
          <div class="hamburger__inner"></div>
        </div>
      </a>
    </div>
  </nav>
</template>
<script>
import logo from '../../assets/img/logo.png';
import logo2x from '../../assets/img/logo@2x.png';

export default {
  data() {
    const data = {
      isShown: false,
    };

    return data;
  },

  methods: {
    showMenu() {
      this.isShown = !this.isShown;
    }
  }
}
</script>

<style type="postcss">
.nav {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 0 30px;
}

.logo{
  &__image {
    height: 90px;
    width: 320px;
  }
}

.hamburger {
  &__wrapper {
    border: 0;
    background-color: transparent;
    color: inherit;
    display: inline-block;
    cursor: pointer;
    font: inherit;
    margin: 0;
    padding: 15px;
    overflow: visible;
    text-transform: none;
    transition-duration: 0.15s;
    transition-timing-function: linear;
    transition-property: opacity,filter;
  }

  &__box {
    display: inline-block;
    height: 24px;
    position: relative;
    width: 40px;
  }

  &__inner {
    background-color: #000;
    border-radius: 4px;
    display: block;
    height: 4px;
    margin-top: -2px;
    position: absolute;
    top: 50%;
    transition-duration: 0.15s;
    transition-timing-function: ease;
    transition-property: transform;
    width: 40px;


    &::before,
    &::after {
      border-radius: 4px;
      background-color: #000;
      content: '';
      display: block;
      height: 4px;
      position: absolute;
      transition-duration: 0.15s;
      transition-timing-function: ease;
      transition-property: transform;
      width: 40px;
    }

    &::before {
      top: -10px;
      transition: top 75ms ease 0.12s,opacity 75ms ease;
    }

    &::after {
      bottom: -10px;
    }

    .hamburger__wrapper--active & {
      transform: rotate(45deg);
      transition-delay: 0.12s;
      transition-timing-function: cubic-bezier(0.215, 0.61, 0.355,1);

      &::after {
        bottom: 0;
        transform: rotate(-90deg);
        transition: bottom 75ms ease,transform 75ms cubic-bezier(0.215, 0.61, 0.355,1) 0.12s;
      }

      &::before {
        opacity: 0;
        top: 0;
        transition: top 75ms ease,opacity 75ms ease 0.12s;
      }
    }
  }
}
</style>
