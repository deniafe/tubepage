import { auth, db, firebase } from '@/plugins/firebase'
import notific from '@/utils/notificFunc'
import tinyurl from 'tinyurl'

export default {
  namespaced: true,
  state: () => {
    return {
      user: null,
      loading: false,
      isAuthenticated: false,
    }
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
    },
    SET_USER_MEMBERSHIP(state, membership) {
      state.user.membership = membership
    },
    SET_IS_AUTHENTICATED(state, status) {
      state.isAuthenticated = status
    },
    SET_LOADING(state, status) {
      state.loading = status
    },
    SET_FEEDBACK(state, msg) {
      state.feedback = msg
    },
    SET_ERROR(state, status) {
      state.error = status
    },
    SET_SHOW_RESET_NOTIFICATION(state, status) {
      state.showResetNotification = status
    },
    SET_PASSWORD_RESET_NOTIFICATION(state, message) {
      state.passwordResetNotification = message
    },
  },
  actions: {
    userAuth({ commit, dispatch }, form) {
      let authenticateUser
      commit('SET_LOADING', true)
      if (form.state === 'Sign Up') {
        authenticateUser = auth.createUserWithEmailAndPassword(
          form.email,
          form.password
        )
      } else if (form.state === 'Log In') {
        authenticateUser = auth.signInWithEmailAndPassword(
          form.email,
          form.password
        )
      }
      commit('SET_FEEDBACK', '')

      authenticateUser
        .then((cred) => {
          const email = cred.user.email
          const id = cred.user.uid
          const verified = cred.user.emailVerified

          if (form.state === 'Sign Up') {
            const name = form.name
            const password = form.password
            const referralPoints = form.referralPoints
            const telegramPoints = form.telegramPoints
            const youtubePoints = form.youtubePoints
            const offerPoints = form.offerPoints
            const totalPoints = form.totalPoints
            const registeredAt = form.registeredAt
            const referredBy = form.referredBy
            const ip = form.ip
            const token = form.token
            cred.user.sendEmailVerification()
            tinyurl.shorten('https://' + form.hostname + '?ref=' + id).then(
              async (res) => {
                await db
                  .collection('users')
                  .doc(id)
                  .set({
                    email,
                    name,
                    password,
                    referralPoints,
                    telegramPoints,
                    youtubePoints,
                    offerPoints,
                    totalPoints,
                    registeredAt,
                    referredBy,
                    ip,
                    token,
                    uniqueLink: res,
                    membership: {
                      startDate: '',
                      endDate: '',
                      interval: '',
                      plan: 'free',
                    },
                  })
                // TODO : THIS PERSON SHOULD ONLY BE GIVEN POINTS AFTER USER HAS VERIFIED THEIR EMAIL ADDRESS
                if (form.referredBy) {
                  await db
                    .collection('users')
                    .doc(form.referredBy)
                    .update({
                      referralPoints: firebase.firestore.FieldValue.increment(
                        100
                      ),
                      totalPoints: firebase.firestore.FieldValue.increment(100),
                    })
                }
                const userData = {
                  email,
                  id,
                  name,
                  referralPoints,
                  telegramPoints,
                  youtubePoints,
                  offerPoints,
                  totalPoints,
                  registeredAt,
                  referredBy,
                  ip,
                  token,
                  uniqueLink: res,
                  verified,
                }
                dispatch('app/setUser', userData, { root: true })
                commit('SET_IS_AUTHENTICATED', true)
                commit('SET_LOADING', false)
                this.$router.push({
                  name: 'download',
                  params: { lead: id },
                  // props: { campaignId: vm.campId },
                })
              },
              function (err) {
                console.log(err)
              }
            )
          }

          if (form.state === 'Log In') {
            console.log('I just logged in')
            db.collection('users')
              .doc(id)
              .get()
              .then((doc) => {
                const data = doc.data()
                const userData = {
                  email: data.email,
                  name: data.name,
                  password: data.password,
                  referralPoints: data.referralPoints,
                  telegramPoints: data.telegramPoints,
                  youtubePoints: data.youtubePoints,
                  offerPoints: data.offerPoints,
                  totalPoints: data.totalPoints,
                  registeredAt: data.registeredAt,
                  referredBy: data.referredBy,
                  ip: data.ip,
                  token: data.token,
                  uniqueLink: data.uniqueLink,
                  membership: data.membership,
                }

                dispatch('app/setUser', userData, { root: true })
                commit('SET_IS_AUTHENTICATED', true)
                commit('SET_LOADING', false)
                this.$router.push({
                  name: 'share',
                  params: { lead: id },
                })
                dispatch('app/setLoginDialog', false, { root: true })
              })
              .catch((error) => {
                commit('SET_LOADING', false)
                dispatch('app/setLoginDialog', false, { root: true })
                // Handle any errors
                const alert = {}
                alert.status = true
                alert.message = error

                notific({
                  dispatch,
                  message: alert,
                })
              })
          }
        })
        .catch((error) => {
          commit('SET_LOADING', false)
          dispatch('app/setLoginDialog', false, { root: true })
          // Handle any errors
          const alert = {}
          alert.status = true
          alert.message = error

          notific({
            dispatch,
            message: alert,
          })
        })
    },
    checkAuth({ state, commit, dispatch }, url) {
      // Check if a user is currently registered in the store
      if (state.user) {
        return state.user
      } else {
        // If not check if a user is signed in with firebase
        // If there is, store the user details
        // Then route the person to dashboard if the person is trying to go to page auth or rest password
        auth.onAuthStateChanged((user) => {
          if (user) {
            const userData = {
              email: user.email,
              id: user.uid,
              verified: user.emailVerified,
              referralPoints: 0,
              socialPoints: 0,
              offerPoints: 0,
              totalPoints: 0,
              uniqueLink: 'https://tubely.com',
            }
            dispatch('app/setUser', userData, { root: true })
            commit('SET_USER', {
              email: user.email,
              id: user.uid,
              verified: user.emailVerified,
            })
            // If there is no user, make sure the person can only access auth and reset password
          } else if (!user) {
            this.$router.push({
              name: 'index',
            })
          }
        })
      }
    },
    sendVerificationEmail({ dispatch }) {
      // eslint-disable-next-line no-console
      auth.currentUser
        .sendEmailVerification()
        .then(() => {
          const alert = {}
          alert.status = true
          alert.message = `Email verification sent`

          notific({
            dispatch,
            message: alert,
            type: true,
          })
        })
        .catch((error) => {
          const alert = {}
          alert.status = true
          alert.message = error

          notific({
            dispatch,
            error: alert,
          })
        })
    },
    signOut({ commit, dispatch }) {
      auth
        .signOut()
        .then(() => {
          commit('SET_USER', null)
          this.$router.push({
            name: 'index',
          })
        })
        .catch((error) => {
          // An error happened.
          const alert = {}
          alert.status = true
          alert.message = error

          notific({
            dispatch,
            message: alert,
          })
        })
    },
  },
  getters: {
    user: (state) => state.user,
    isAuthenticated: (state) => state.isAuthenticated,
    loading: (state) => state.loading,
  },
}
