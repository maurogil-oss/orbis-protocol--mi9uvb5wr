migrate(
  (app) => {
    let user = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    user.setPassword('OrbisProtocol2026')
    user.setVerified(true)
    user.set('role', 'master')

    app.save(user)

    let refreshed = app.findFirstRecordByData('users', 'email', 'maurog1@hotmail.com')
    let valid = refreshed.validatePassword('OrbisProtocol2026')
    let updated = refreshed.getString('updated')
    let role = refreshed.getString('role')
    let verified = refreshed.getBool('verified')

    throw new Error(
      'DEBUG_VALIDATE: ' +
        JSON.stringify({
          valid: valid,
          updated: updated,
          role: role,
          verified: verified,
        }),
    )
  },
  (app) => {},
)
