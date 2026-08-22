import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_UL9OKBpHCwZ7@ep-jolly-lake-ay02bcdt-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { walletAddress, platform, contextType, content } = body;

    if (!walletAddress || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS user_contexts (
        id SERIAL PRIMARY KEY,
        wallet_address VARCHAR(255) NOT NULL,
        platform VARCHAR(100),
        context_type VARCHAR(100),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Insert new context
    const result = await sql`
      INSERT INTO user_contexts (wallet_address, platform, context_type, content)
      VALUES (${walletAddress}, ${platform || 'unknown'}, ${contextType || 'general'}, ${content})
      RETURNING *
    `;

    return NextResponse.json({ success: true, data: result[0] });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
      return NextResponse.json({ error: 'Missing walletAddress parameter' }, { status: 400 });
    }

    const result = await sql`
      SELECT * FROM user_contexts 
      WHERE wallet_address = ${walletAddress}
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    console.error('DB Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
