import { Inngest } from "inngest"

const isDev = process.env.NODE_ENV !== "production"

export const inngest = new Inngest({
    id: "email-automation-platform",
    isDev,
    eventKey: process.env.INNGEST_EVENT_KEY,
    signingKey: process.env.INNGEST_SIGNING_KEY,
    ...(isDev && {
        baseUrl: "http://localhost:8288",
    }),
})