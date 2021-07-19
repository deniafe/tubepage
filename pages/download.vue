<template>
  <div>
    <section class="w-full px-8 py-16 xl:px-8 h-screen">
      <div class="w-full mt-16 md:mt-0 md:w-3/5 mx-auto">
        <div
          class="h-auto p-8 py-10 overflow-hidden bg-secondary border-b-2 border-secondary rounded-lg shadow-2xl px-7"
        >
          <h3 class="mb-2 text-xl font-medium text-center text-gray-200">
            Click the link below to download Tubely for windows.
          </h3>
          <div class="text-gray-300 text-center mb-1">
            <span class="font-medium text-gray-200">Email:</span>
            {{ user.email }}
          </div>
          <div class="text-gray-300 text-center mb-6">
            <span class="font-medium text-gray-200">Password:</span>
            {{ user.password }}
          </div>
          <h6 class="text-gray-500 text-center mb-6">
            You might have to wait a few second for your downlaod to start.
            After clicking the link, waut a few seconds and your download should
            start shortly
          </h6>
          <div class="block text-center mb-4">
            <i
              class="fa fa-download text-primary text-lg animate-bounce"
              aria-hidden="true"
            ></i>
            <a
              href="https://github.com/deniafe/tubely/releases/download/v0.2.1/tubely-Setup-0.2.1.exe"
              rel="nofollow"
              class="w-full px-3 py-4 font-medium text-lg text-primary focus:outline-none underline"
              @click="clicked = true"
            >
              tubely-Setup-0.2.1.exe
            </a>
          </div>
          <h6
            v-if="clicked"
            class="text-gray-300 font-semibold text-center mb-6"
          >
            Your Download will start shortly ...
          </h6>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { db } from '@/plugins/firebase'
export default {
  data() {
    return {
      clicked: false,
      unsubscribe: '',
    }
  },
  computed: {
    ...mapGetters({
      user: 'app/user',
    }),
  },
  watch: {
    user() {
      if (this.user) {
        this.getUser()
      }
    },
  },
  mounted() {
    this.$store.dispatch('auth/checkAuth')
  },
  beforeDestroy() {
    this.unsubscribe()
  },
  methods: {
    getUser() {
      if (!this.user.password) {
        const vm = this
        this.unsubscribe = db
          .collection('users')
          .doc(vm.user.id)
          .onSnapshot(
            (snapshot) => {
              if (snapshot.exists) {
                // ...
                const user = snapshot.data()
                user.id = snapshot.id
                vm.$store.commit('app/SET_USER', user)
                console.log('Document does exists')
              } else {
                console.log('This document does not exist')
              }
            },
            (error) => {
              // ...
              console.log(
                'Could not listen to changes on this snapshot:',
                error
              )
              vm.$router.push({ name: 'index' })
            }
          )
      }
    },
  },
}
</script>
