<template>
  <nav class="navigation"
    :class="{'navigation--active': isShown}">
    <ul class="navigation__set navigation__set--top">
      <li class="navigation__item">
        <h3 class="navigation__header">Home</h3>
      </li>
      <li class="navigation__item">
        <h3 class="navigation__header">Work</h3>
        <ul class="navigation__set navigation__set--nested">
          <li class="navigation__item navigation__item--nested">Restaurant & Bar</li>
          <li class="navigation__item navigation__item--nested">Coffee & Boba</li>
          <li class="navigation__item navigation__item--nested">Retail</li>
          <li class="navigation__item navigation__item--nested">Others</li>
        </ul>
      </li>
      <li class="navigation__item">
        <h3 class="navigation__header">About</h3>
        <ul class="navigation__set navigation__set--nested">
          <li class="navigation__item navigation__item--nested">Our Story</li>
          <li class="navigation__item navigation__item--nested">People</li>
          <li class="navigation__item navigation__item--nested">Events / News</li>
        </ul>
      </li>
      <li class="navigation__item"><h3 class="navigation__header">Contact</h3></li>
    </ul>
  </nav>
</template>

<script>
export default {
  props: {
    /** @prop {boolean} - whether menu is shown */
    isShown: {
      default: false,
      type: Boolean,
    },
  },

  data() {
    const data = {
    };

    return data;
  },
}
</script>

<style type="postcss">
.navigation {
  background: #ECECEC;
  color: #707070;
  max-width: 100%;
  min-height: 100vh;
  padding: 59px;
  position: absolute;
  right: -533px;
  top: 0;
  transform: translateX(0);
  transition: transform 0.5s ease-in-out;
  width: 533px;
  z-index: 2;
}

.toggle-enter-active, .toggle-leave-active {
  transform: translateX(0);
  transition: transform 0.5s ease-in-out;
}
.toggle-enter, .toggle-leave-to /* .toggle-leave-active below version 2.1.8 */ {
  transform: translateX(533px);
}
</style>