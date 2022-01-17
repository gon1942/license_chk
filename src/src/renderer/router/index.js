import Vue from 'vue'
import Router from 'vue-router'
import About from '../views/About.vue'
import Help from '../views/Help.vue'
import Home from '../views/Home.vue'
import Testpage from '../views/test.vue'

import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/black-green-dark.css'


Vue.use( VueMaterial)
Vue.use(Router)

const router = new Router({
  routes: [
    {
      path: '/',
      redirect: '/home',
    },
    {
      path: '/home',
      meta: {
        title: 'Home',
        icon: 'fa-home',
      },
      component: Home,
    },
    {
      path: '/about',
      meta: {
        title: 'About',
        icon: 'fa-info-circle',
      },
      component: About,
    },
    {
      path: '/help',
      meta: {
        title: 'Help',
        icon: 'fa-info-circle',
      },
      component: Help,
    },
    {
      path: '/Testpage',
      meta: {
        title: 'Testpage',
        icon: 'fa-info-circle',
      },
      component: Testpage,
    },
    {
      path: '*',
      redirect: '/home',
    },
  ],
})

// dynamically set application title to current view
router.afterEach((to) => {
  let title =
    to.path === '/home'
      ? process.env.PRODUCT_NAME
      : `${to.meta.title} - ${process.env.PRODUCT_NAME}`

  if (!title) {
    title = 'Home'
  }

  document.title = title
})

export default router
