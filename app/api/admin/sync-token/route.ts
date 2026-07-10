import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wallet } = await request.json();
    if (!wallet) {
      return NextResponse.json({ error: 'Wallet is required' }, { status: 400 });
    }

    let res;
    if (wallet.startsWith('0x')) {
      res = await fetch(`https://awk00kk00gskkw0o8kc488kg.notoriouslywrong.com/v1/robinhood/accounts/${wallet}/created?limit=50`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch from robinhood' }, { status: 500 });
      }
      const data = await res.json();
      
      if (data && data.tokens && data.tokens.length > 0) {
        try {
          const tokenRes = await fetch(`https://awk00kk00gskkw0o8kc488kg.notoriouslywrong.com/v1/robinhood/token/${data.tokens[0].address}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            }
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            data.tokens[0].twitter = tokenData.token?.twitter || '';
          }
        } catch (err) {
          console.error('Error fetching token details:', err);
        }
      }
      
      return NextResponse.json(data);
    } else {
      res = await fetch(`https://frontend-api-v3.pump.fun/coins-v2/user-created-coins/${wallet}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (!res.ok) {
        return NextResponse.json({ error: 'Failed to fetch from pump.fun' }, { status: 500 });
      }
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[v0] Sync token error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
