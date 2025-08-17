#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

async function main() {
  const userId = process.env.TEST_PUSH_USER_ID
  const title = process.env.TEST_PUSH_TITLE || 'Test Notification'
  const body = process.env.TEST_PUSH_BODY || 'Hello from DharmaSaathi test'
  const link = process.env.TEST_PUSH_LINK || null

  const baseUrl = process.env.TEST_WEB_BASE_URL || 'http://localhost:3000'
  const internalKey = process.env.INTERNAL_API_KEY || ''

  if (!userId) {
    console.error('Missing TEST_PUSH_USER_ID')
    process.exit(1)
  }

  const payload = { userId, title, body, data: link ? { link } : undefined }
  const res = await fetch(`${baseUrl}/api/expo/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(internalKey ? { 'x-internal-api-key': internalKey } : {}),
    },
    body: JSON.stringify(payload),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Failed:', res.status, json)
    process.exit(1)
  }
  console.log('OK:', JSON.stringify(json, null, 2))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})


