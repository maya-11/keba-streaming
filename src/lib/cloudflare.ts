const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4';

interface CloudflareUploadResponse {
  result: {
    uid: string;
    thumbnail: string;
    playback: { hls: string; dash: string };
    preview: string;
    duration: number;
  };
  success: boolean;
}

export async function getUploadUrl(): Promise<{ uploadUrl: string; videoId: string }> {
  const response = await fetch(
    `${CLOUDFLARE_API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream?direct_user=true`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        maxDurationSeconds: 21600,
        requireSignedURLs: false,
      }),
    }
  );

  const headerUploadUrl = response.headers.get('location');
  const data = (await response.json()) as CloudflareUploadResponse;

  return {
    uploadUrl: headerUploadUrl || '',
    videoId: data.result.uid,
  };
}

export async function getVideoDetails(videoId: string) {
  const response = await fetch(
    `${CLOUDFLARE_API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
    }
  );

  const data = (await response.json()) as CloudflareUploadResponse;
  return data.result;
}

export async function deleteVideo(videoId: string) {
  await fetch(
    `${CLOUDFLARE_API}/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/${videoId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      },
    }
  );
}

export function getStreamUrl(videoId: string): string {
  return `https://${process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN}/${videoId}/manifest/video.m3u8`;
}

export function getThumbnailUrl(videoId: string): string {
  return `https://${process.env.CLOUDFLARE_STREAM_CUSTOMER_SUBDOMAIN}/${videoId}/thumbnails/thumbnail.jpg`;
}
