const IMGBB_API_KEY = process.env.IMGBB_API_KEY || 'f6c9a49e46bd9eb119a20c2351475bfb';

export async function uploadToImgBB(base64Image: string): Promise<string> {
  const formData = new FormData();
  formData.append('image', base64Image);

  const response = await fetch(
    `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload image to ImgBB');
  }

  const data = await response.json();
  return data.data.url;
}
