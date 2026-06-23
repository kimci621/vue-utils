const POLL_MAX_ATTEMPTS = 10
const POLL_INTERVAL_MS = 10000

let pollTimer: ReturnType<typeof setTimeout> | null = null
let errorType = ''

const sleep = (ms: number) => {
  return new Promise<void>((resolve) => {
      pollTimer = setTimeout(resolve, ms)
    })
}

async function polling() {
    // if some blocker type here
    let pollCancelled = false

    for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt++) {
      if (pollCancelled) return

      // some async action
      // const { data, error: err } = await somefetch({someBody})
      if (pollCancelled) return

      // on 
      // if (!err && Array.isArray(data)) {
      //   localData = data
      //   return
      // }

      if (attempt < POLL_MAX_ATTEMPTS) await sleep(POLL_INTERVAL_MS)
    }

    errorType = 'polling_timeout'
    console.error('polling timeout')
}
