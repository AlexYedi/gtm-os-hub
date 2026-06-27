'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { cockpitToken, COCKPIT_COOKIE } from '@/lib/auth'

export async function loginAction(formData: FormData) {
  const pw = String(formData.get('password') || '')
  if (pw && pw === process.env.COCKPIT_PASSWORD) {
    const jar = await cookies()
    jar.set(COCKPIT_COOKIE, cockpitToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    redirect('/cockpit/university')
  }
  redirect('/cockpit/login?e=1')
}
