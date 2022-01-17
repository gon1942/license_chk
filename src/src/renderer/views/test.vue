<template>
  <div>
    <section class="hero is-dark is-bold">
      <div class="hero-body">
        <br />
        <div class="block has-text-centered">
          <figure class="image is-128x128">
            <img alt="Placeholder image" src="../../../_icons/512pxblue.png" />
          </figure>
        </div>
        <div class="content has-text-centered">
         Testpage
          
          <RouterLink class="button is-primary" to="home">
            <i class="material-icons">home</i>
            <span>Home</span>
          </RouterLink>
          
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

enum TEST {}

export default Vue.extend({
  name: 'Home',
})
</script>

<style>
.hero-body {
  height: 100vh;
}
</style>
