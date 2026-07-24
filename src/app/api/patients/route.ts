import { db } from '@/src/db'
import { patients } from '@/src/db/schema/patients'
import { NextResponse } from 'next/server'

const cors = {
  'Access-Control-Allow-Origin': 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: cors })
}

export async function GET() {
  try {
    const allPatients = await db.select().from(patients)
    return NextResponse.json(allPatients, { headers: cors })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500, headers: cors })
  }
}