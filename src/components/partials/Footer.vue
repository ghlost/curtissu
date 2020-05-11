<template>
  <footer class="footer">
    <div class="footer__inner">
      <div class="footer__logos">
        <a href="#" class="footer__social-links"><svg class="icon icon--insta"><title>insta</title><use xlink:href="#insta"></use></svg></a>
        <a href="#" class="footer__social-links"><svg class="icon icon--email"><title>email</title><use xlink:href="#email"></use></svg></a>
        <a href="#" class="footer__social-links"><svg class="icon icon--phone"><title>phone</title><use xlink:href="#phone"></use></svg></a>
      </div>
      <p class="footer__copy">309 E 8th St, Los Angeles, CA 90014</p>
      <p class="footer__copy">©2020 Curtis Su Associates</p>
    </div>
  </footer>
</template>

<style type="postcss">
.footer {
  clear: both;
  display: flex;
  justify-content: flex-end;
  margin: 100px 0 0 0;
  padding: 0 30px;

  &__inner {
    align-items: center;
    display: flex;
    justify-content: space-between;
    max-width: 1006px;
    width: 100%;
  }

  &__logos {
    align-items: center;
    display: flex;
    justify-content: space-between;
    max-width: 195px;
    width: 100%;
  }

  &__social-links {
    .icon--insta {
      max-height: 33px;
      max-width: 33px;
    }

    .icon--email {
      max-height: 27px;
      max-width: 38px;
    }

    .icon--phone {
      max-height: 32px;
      max-width: 24px;
    }
  }

  &__copy {
    color: #AFAFAF;
    font-size: 18px;
    line-height: 1.2;
  }
}
</style>
