import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'config.json');

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return NextResponse.json({ success: true, data: { bannerUrl: '' } });
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    
    let newData: any = {};
    const currentData = fs.existsSync(DATA_FILE) ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) : {};
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('bannerFile') as File | null;
      let bannerUrl = currentData.bannerUrl || '';
      
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        // Save the file to public/uploads
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        // Create unique filename based on current time
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `banner-${Date.now()}.${ext}`;
        const filePath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filePath, buffer);
        bannerUrl = `/uploads/${filename}`;
      }
      
      const formBannerUrl = formData.get('bannerUrl') as string | null;
      if (formBannerUrl !== null) {
        bannerUrl = formBannerUrl; // If user submitted a text URL, it overrides
      }
      
      newData = { ...currentData, bannerUrl };
    } else {
      const body = await req.json();
      newData = { ...currentData, ...body };
    }

    fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
    return NextResponse.json({ success: true, data: newData });
  } catch (error: any) {
    console.error('Error saving config:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
