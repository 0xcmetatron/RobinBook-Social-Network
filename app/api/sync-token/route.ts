import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

let lastCheck = 0;
let isChecking = false;

export async function GET() {
  try {
    const now = Date.now();
    if (now - lastCheck < 60000 || isChecking) {
      return NextResponse.json({ status: 'cached or checking' });
    }

    isChecking = true;
    
    const walletRows = await query<any[]>("SELECT setting_value FROM site_settings WHERE setting_key = 'dev_wallet'");
    const devWallet = walletRows.length > 0 ? walletRows[0].setting_value : null;

    if (!devWallet) {
      isChecking = false;
      return NextResponse.json({ status: 'no dev wallet' });
    }

    if (devWallet.startsWith('0x')) {
      const res = await fetch(`https://awk00kk00gskkw0o8kc488kg.notoriouslywrong.com/v1/robinhood/accounts/${devWallet}/created?limit=50`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (!res.ok) {
        isChecking = false;
        return NextResponse.json({ status: 'robinhood api error' });
      }

      const data = await res.json();
      if (data && data.tokens && data.tokens.length > 0) {
        const latestCoin = data.tokens[0];
        const mint = latestCoin.address;
        
        let twitter = '';
        try {
          const tokenRes = await fetch(`https://awk00kk00gskkw0o8kc488kg.notoriouslywrong.com/v1/robinhood/token/${mint}`, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Mozilla/5.0'
            }
          });
          if (tokenRes.ok) {
            const tokenData = await tokenRes.json();
            twitter = tokenData.token?.twitter || '';
          }
        } catch (err) {
          console.error('Error fetching token details:', err);
        }

        const mintRows = await query<any[]>("SELECT setting_value FROM site_settings WHERE setting_key = 'contract_address'");
        const currentMint = mintRows.length > 0 ? mintRows[0].setting_value : '';

        if (currentMint !== mint) {
          await query(
            `INSERT INTO site_settings (setting_key, setting_value) VALUES ('contract_address', ?) 
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
            [mint]
          );
          if (twitter) {
            await query(
              `INSERT INTO site_settings (setting_key, setting_value) VALUES ('twitter_url', ?) 
               ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
              [twitter]
            );
          }
        }
      }
    } else {
      const res = await fetch(`https://frontend-api-v3.pump.fun/coins-v2/user-created-coins/${devWallet}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0'
        }
      });
      if (!res.ok) {
        isChecking = false;
        return NextResponse.json({ status: 'pump.fun api error' });
      }

      const data = await res.json();
      if (data && data.coins && data.coins.length > 0) {
        const latestCoin = data.coins[0];
        const mint = latestCoin.mint;
        const twitter = latestCoin.twitter || '';

        const mintRows = await query<any[]>("SELECT setting_value FROM site_settings WHERE setting_key = 'contract_address'");
        const currentMint = mintRows.length > 0 ? mintRows[0].setting_value : '';

        if (currentMint !== mint) {
          await query(
            `INSERT INTO site_settings (setting_key, setting_value) VALUES ('contract_address', ?) 
             ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
            [mint]
          );
          if (twitter) {
            await query(
              `INSERT INTO site_settings (setting_key, setting_value) VALUES ('twitter_url', ?) 
               ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
              [twitter]
            );
          }
        }
      }
    }
    
    lastCheck = Date.now();
    isChecking = false;
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    isChecking = false;
    return NextResponse.json({ status: 'error', error: String(error) });
  }
}
