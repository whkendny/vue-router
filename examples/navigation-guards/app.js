import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

/*
* 1. 定义路由组件
* */
const Home = { template: '<div>home</div>' }
const Foo = { template: '<div>foo</div>' }
const Bar = { template: '<div>bar</div>' }

/**
 * 1.1 声明所有的路由钩子
 * Signatre of all route guards:
 * @param {Route} to: Route: 即将要进入的目标 路由对象
 * @param {Route} from:  Route: 当前导航正要离开的路由
 * @param {Function} next
 *      next(): 进行管道中的下一个钩子。
 *      next('/baz'): 当前的导航被中断，然后进行一个新的导航。
 *      next(false): 中断当前的导航
 * See http://router.vuejs.org/en/advanced/navigation-guards.html
 * for more details.
 */
function guardRoute (to, from, next) {
  if (window.confirm(`Navigate to ${to.path}?`)) {
    next()
  } else if (window.confirm(`Redirect to /baz?`)) {
    next('/baz')
  } else {
    next(false)
  }
}

// Baz implements an in-component beforeRouteLeave hook
const Baz = {
  data () {
    return { saved: false }
  },
  template: `
    <div>
      <p>baz ({{ saved ? 'saved' : 'not saved' }})</p>
      <button @click="saved = true">save</button>
    </div>
  `,
  /*  leave 钩子通常用来禁止用户在还未保存修改前突然离开。*/
  beforeRouteLeave (to, from, next) {
    if (this.saved || window.confirm('Not saved, are you sure you want to navigate away?')) {
      next()
    } else {
      next(false)
    }
  }
}

// Qux implements an in-component beforeRouteEnter hook
const Qux = {
  data () {
    return {
      msg: '1212'
    }
  },
  template: `<div>{{ msg }}</div>`,
  beforeRouteEnter (to, from, next) {
    // Note that enter hooks do not have access to `this`
    // because it is called before the component is even created.
    // However, we can provide a callback to `next` which will
    // receive the vm instance when the route has been confirmed.
    //
    // simulate an async data fetch.
    // this pattern is useful when you want to stay at current route
    // and only switch after the data has been fetched.
    setTimeout(() => {
      next(vm => {
        vm.msg = Qux.data().msg
      })
    }, 300)
  }
}

// Quux implements an in-component beforeRouteUpdate hook.
// this hook is called when the component is reused, but the route is updated.
// For example, when navigating from /quux/1 to /quux/2.
const Quux = {
  data () {
    return {
      prevId: 0,
      toId: 0
    }
  },
  template: `<div>id:{{ $route.params.id }} prevId:{{ prevId }}, toId:{{toId}}</div>`,
  beforeRouteUpdate (to, from, next) {
    this.prevId = from.params.id
    this.toId = to.params.id
    next()
  }
}

/*
* 3. 创建 router 实例，然后传 `routes` 配置你还可以传别的配置参数
* */
const router = new VueRouter({
  mode: 'history',
  base: __dirname,

  /*
   * 2. 定义路由
   * 每个路由应该映射一个组件。 其中"component" 可以是
   * 通过 Vue.extend() 创建的组件构造器
   * */
  routes: [
    { path: '/', component: Home },

    // inline guard
    { path: '/foo', component: Foo, beforeEnter: guardRoute },

    // using meta properties on the route config
    // and check them in a global before hook
    { path: '/bar', component: Bar, meta: { needGuard: true }},

    // Baz implements an in-component beforeRouteLeave hook
    { path: '/baz', component: Baz },

    // Qux implements an in-component beforeRouteEnter hook
    { path: '/qux', component: Qux },

   // in-component beforeRouteEnter hook for async components
    { path: '/qux-async', component: resolve => {
      setTimeout(() => {
        resolve(Qux)
      }, 0)
    } },

    // in-component beforeRouteUpdate hook
    { path: '/quux/:id', component: Quux }
  ]
})

router.beforeEach((to, from, next) => {
  /*
  * m => m.meta.needGuard
  * function(m){
  *   return m.meta.needGuard
  * }
  * */
  if (to.matched.some(m => m.meta.needGuard)) {
    guardRoute(to, from, next)
  } else {
    next()
  }
})

/*
* 4. 创建和挂载根实例。
* 记得要通过 router 配置参数注入路由，
* 从而让整个应用都有路由功能
* */
new Vue({
  router,
  template: `
    <div id="app">
      <h1>Navigation Guards</h1>
      <ul>
        <li><router-link to="/">/</router-link></li>
        <li><router-link to="/foo">/foo</router-link></li>
        <li><router-link to="/bar">/bar</router-link></li>
        <li><router-link to="/baz">/baz</router-link></li>
        <li><router-link to="/qux">/qux</router-link></li>
        <li><router-link to="/qux-async">/qux-async</router-link></li>
        <li><router-link to="/quux/1">/quux/1</router-link></li>
        <li><router-link to="/quux/2">/quux/2</router-link></li>
      </ul>
      <router-view class="view"></router-view>
    </div>
  `
}).$mount('#app')
