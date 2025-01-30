const API_BASE_URL = 'http://127.0.0.1:5000';

const adjectives = [
  'Mystic', 'Cosmic', 'Digital', 'Quantum', 'Cyber', 'Epic', 'Golden', 'Silver',
  'Crystal', 'Shadow', 'Neon', 'Stellar', 'Thunder', 'Lightning', 'Pixel', 'Ninja',
  'Dragon', 'Phoenix', 'Omega', 'Ultra', 'Hyper', 'Super', 'Mega', 'Astro',
  'Techno', 'Retro', 'Turbo', 'Power', 'Laser', 'Plasma'
];

const nouns = [
  'Warrior', 'Master', 'Sage', 'Hunter', 'Knight', 'Wizard', 'Ranger', 'Guardian',
  'Explorer', 'Pioneer', 'Captain', 'Commander', 'Legend', 'Hero', 'Champion',
  'Seeker', 'Tracker', 'Voyager', 'Nomad', 'Wanderer', 'Sentinel', 'Defender',
  'Keeper', 'Scholar', 'Merchant', 'Trader', 'Collector', 'Adventurer'
];

// Default fetch options for all API calls
const defaultFetchOptions = {
  credentials: 'include' as RequestCredentials,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

export function generateRandomUsername(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(Math.random() * 1000);
  return `${adjective}${noun}${number}`;
}

export async function uploadFile(file: File, enableAI: boolean, sessionId: string): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('enableAI', String(enableAI));
  formData.append('sessionId', sessionId); 


  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Upload failed');
    }
    
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Upload failed');
  }
}

export async function loadSampleData(): Promise<UploadResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/sample-data`, {
      method: 'POST',
      ...defaultFetchOptions,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to load sample data');
    }
    
    return data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to load sample data');
  }
}

export async function createSession(username: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'POST',
      ...defaultFetchOptions,
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }

    return await response.json();
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : 'Failed to create session');
  }
}

export const uploadTagMapping = async (file: File, sessionId: string) => {
  const formData = new FormData();
  formData.append('pdtFile', file);
  formData.append('sessionId', sessionId);

  const response = await fetch(`${API_BASE_URL}/upload_tags`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload tag mapping');
  }

  return response.json();
};