<template>
  <section class="project-grid">
    <div class="project-grid__inner">
      <figure class="project">
        <a href="https://www.google.com/" class="project__link"><img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image"></a>
        <figcaption class="project__name">Matcha Village, Sawtelle, CA</figcaption>
      </figure>
      <figure class="project">
        <a href="https://www.google.com/" class="project__link"><img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image"></a>
        <figcaption class="project__name">Matcha Village, Sawtelle, CA</figcaption>
      </figure>
      <figure class="project">
        <a href="https://www.google.com/" class="project__link"><img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image"></a>
        <figcaption class="project__name">Matcha Village, Sawtelle, CA</figcaption>
      </figure>
      <figure class="project">
        <a href="https://www.google.com/" class="project__link"><img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image"></a>
        <figcaption class="project__name">Matcha Village, Sawtelle, CA</figcaption>
      </figure>
      <figure class="project">
        <a href="https://www.google.com/" class="project__link"><img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image"></a>
        <figcaption class="project__name">Matcha Village, Sawtelle, CA</figcaption>
      </figure>
      <figure class="project">
        <a href="https://www.google.com/" class="project__link"><img src="/wp-content/themes/curtissu/dist/img/matcha.png" alt="project name" class="project__image"></a>
        <figcaption class="project__name">Matcha Village, Sawtelle, CA</figcaption>
      </figure>
    </div>
  </section>
</template>

<script>
import matcha from '../../assets/img/matcha.png';

export default {
  props: {
    /** @prop {string} - image name */
    testImage: {
      default: matcha,
      type: String,
    },
  }
}
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

        & + .project__name {
          opacity: 1;
        }
      }
    }
    &__name {
      opacity: 0;
      text-align: center;
      transition: opacity 0.1s ease-in-out;
    }
  }
</style>
