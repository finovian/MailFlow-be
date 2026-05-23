import { Inngest } from "inngest"
import { env } from "../config/env.js"

const isDev = env.NODE_ENV === "development"

export const inngest = new Inngest({
    id: "email-automation-platform",
    isDev,
    eventKey: env.INNGEST_EVENT_KEY,
    signingKey: env.INNGEST_SIGNING_KEY,
    ...(isDev && {
        baseUrl: "http://127.0.0.1:8288",
    }),
})