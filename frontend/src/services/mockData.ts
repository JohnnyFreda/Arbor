// Mock data service - simulates backend API using localStorage
import { User, RegisterData, LoginCredentials } from '../api/auth';

// Mock user data
let mockUsers: User[] = JSON.parse(localStorage.getItem('mockUsers') || '[]');
let currentUserId: number | null = parseInt(localStorage.getItem('currentUserId') || '0') || null;

// Mock entries
export interface Entry {
  id: number;
  user_id: number;
  project_id?: number | null;
  date: string;
  title?: string;
  body?: string;
  looking_ahead?: string;
  mood: number | null;
  focus_score?: number | null;
  created_at: string;
  updated_at: string;
  tags: string[]; // Stored as strings, will be converted when needed
}

// Mock projects
export interface Project {
  id: number;
  user_id: number;
  name: string;
  description: string | null;
  created_at: string;
}

// Mock tags
export interface Tag {
  id: number;
  user_id: number;
  name: string;
}

// Initialize with sample data if empty
if (mockUsers.length === 0) {
  mockUsers = [
    {
      id: 1,
      email: 'dev@example.com',
      created_at: new Date().toISOString(),
    },
  ];
  localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
}

// Auth mock service
export const mockAuth = {
  register: async (data: RegisterData): Promise<User> => {
    // Check if user exists
    const existing = mockUsers.find((u) => u.email === data.email);
    if (existing) {
      throw new Error('Email already registered');
    }

    // Create new user
    const newUser: User = {
      id: mockUsers.length + 1,
      email: data.email,
      created_at: new Date().toISOString(),
    };

    mockUsers.push(newUser);
    localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
    return newUser;
  },

  login: async (credentials: LoginCredentials): Promise<{ access_token: string; token_type: string }> => {
    const user = mockUsers.find((u) => u.email === credentials.email);
    if (!user) {
      throw new Error('Incorrect email or password');
    }

    // In mock mode, any password works
    currentUserId = user.id;
    localStorage.setItem('currentUserId', user.id.toString());
    return {
      access_token: 'mock-token',
      token_type: 'bearer',
    };
  },

  getMe: async (): Promise<User> => {
    if (!currentUserId) {
      throw new Error('Not authenticated');
    }
    const user = mockUsers.find((u) => u.id === currentUserId);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  },

  logout: async (): Promise<void> => {
    currentUserId = null;
    localStorage.removeItem('currentUserId');
  },
};

// Entries mock service
let mockEntries: Entry[] = JSON.parse(localStorage.getItem('mockEntries') || '[]');

export const mockEntriesService = {
  getAll: async (filters?: {
    project_id?: number;
    tag?: string;
    search?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Entry[]> => {
    if (!currentUserId) throw new Error('Not authenticated');

    let entries = mockEntries.filter((e) => e.user_id === currentUserId);

    if (filters?.project_id) {
      entries = entries.filter((e) => e.project_id === filters.project_id);
    }

    if (filters?.tag) {
      entries = entries.filter((e) => e.tags.includes(filters.tag!));
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      entries = entries.filter(
        (e) =>
          (e.title ?? '').toLowerCase().includes(search) ||
          (e.body ?? '').toLowerCase().includes(search)
      );
    }

    if (filters?.date_from) {
      entries = entries.filter((e) => e.date >= filters.date_from!);
    }

    if (filters?.date_to) {
      entries = entries.filter((e) => e.date <= filters.date_to!);
    }

    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getById: async (id: number): Promise<Entry> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const entry = mockEntries.find((e) => e.id === id && e.user_id === currentUserId);
    if (!entry) throw new Error('Entry not found');
    return entry;
  },

  create: async (data: {
    project_id?: number | null;
    date: string;
    title: string;
    body: string;
    mood?: number | null;
    focus_score?: number | null;
    tags?: string[];
  }): Promise<Entry> => {
    if (!currentUserId) throw new Error('Not authenticated');

    const newEntry: Entry = {
      id: mockEntries.length + 1,
      user_id: currentUserId,
      project_id: data.project_id || null,
      date: data.date,
      title: data.title,
      body: data.body,
      mood: data.mood || null,
      focus_score: data.focus_score || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: data.tags || [],
    };

    mockEntries.push(newEntry);
    localStorage.setItem('mockEntries', JSON.stringify(mockEntries));
    return newEntry;
  },

  update: async (id: number, data: Partial<Entry>): Promise<Entry> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const index = mockEntries.findIndex((e) => e.id === id && e.user_id === currentUserId);
    if (index === -1) throw new Error('Entry not found');

    mockEntries[index] = {
      ...mockEntries[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    localStorage.setItem('mockEntries', JSON.stringify(mockEntries));
    return mockEntries[index];
  },

  delete: async (id: number): Promise<void> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const index = mockEntries.findIndex((e) => e.id === id && e.user_id === currentUserId);
    if (index === -1) throw new Error('Entry not found');
    mockEntries.splice(index, 1);
    localStorage.setItem('mockEntries', JSON.stringify(mockEntries));
  },
};

// Projects mock service
let mockProjects: Project[] = JSON.parse(localStorage.getItem('mockProjects') || '[]');

export const mockProjectsService = {
  getAll: async (): Promise<Project[]> => {
    if (!currentUserId) throw new Error('Not authenticated');
    return mockProjects.filter((p) => p.user_id === currentUserId);
  },

  create: async (data: { name: string; description?: string }): Promise<Project> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const newProject: Project = {
      id: mockProjects.length + 1,
      user_id: currentUserId,
      name: data.name,
      description: data.description || null,
      created_at: new Date().toISOString(),
    };
    mockProjects.push(newProject);
    localStorage.setItem('mockProjects', JSON.stringify(mockProjects));
    return newProject;
  },

  update: async (id: number, data: { name?: string; description?: string }): Promise<Project> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const index = mockProjects.findIndex((p) => p.id === id && p.user_id === currentUserId);
    if (index === -1) throw new Error('Project not found');
    mockProjects[index] = { ...mockProjects[index], ...data };
    localStorage.setItem('mockProjects', JSON.stringify(mockProjects));
    return mockProjects[index];
  },

  delete: async (id: number): Promise<void> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const index = mockProjects.findIndex((p) => p.id === id && p.user_id === currentUserId);
    if (index === -1) throw new Error('Project not found');
    mockProjects.splice(index, 1);
    localStorage.setItem('mockProjects', JSON.stringify(mockProjects));
  },
};

// Tags mock service
let mockTags: Tag[] = JSON.parse(localStorage.getItem('mockTags') || '[]');

export const mockTagsService = {
  getAll: async (): Promise<Tag[]> => {
    if (!currentUserId) throw new Error('Not authenticated');
    return mockTags.filter((t) => t.user_id === currentUserId);
  },

  create: async (name: string): Promise<Tag> => {
    if (!currentUserId) throw new Error('Not authenticated');
    // Check if tag already exists
    const existing = mockTags.find((t) => t.user_id === currentUserId && t.name === name);
    if (existing) return existing;

    const newTag: Tag = {
      id: mockTags.length + 1,
      user_id: currentUserId,
      name,
    };
    mockTags.push(newTag);
    localStorage.setItem('mockTags', JSON.stringify(mockTags));
    return newTag;
  },

  delete: async (id: number): Promise<void> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const index = mockTags.findIndex((t) => t.id === id && t.user_id === currentUserId);
    if (index === -1) throw new Error('Tag not found');
    mockTags.splice(index, 1);
    localStorage.setItem('mockTags', JSON.stringify(mockTags));
  },
};

// Calendar mock service
export const mockCalendarService = {
  getMonth: async (
    year: number,
    month: number,
    filters?: { project_id?: number; tag?: string }
  ): Promise<any> => {
    if (!currentUserId) throw new Error('Not authenticated');
    let entries = mockEntries.filter((e) => e.user_id === currentUserId);
    
    // Apply filters
    if (filters?.project_id) {
      entries = entries.filter((e) => e.project_id === filters.project_id);
    }
    
    if (filters?.tag) {
      entries = entries.filter((e) => e.tags.includes(filters.tag!));
    }
    
    // Filter entries for the month
    const monthEntries = entries.filter((e) => {
      const entryDate = new Date(e.date);
      return entryDate.getFullYear() === year && entryDate.getMonth() === month - 1;
    });

    // Group by day and calculate average mood
    const days: Record<number, any> = {};
    monthEntries.forEach((entry) => {
      const day = new Date(entry.date).getDate();
      if (!days[day]) {
        days[day] = { entries: [], moods: [], entry_count: 0 };
      }
      days[day].entries.push(entry);
      days[day].entry_count = days[day].entries.length;
      if (entry.mood !== null) {
        days[day].moods.push(entry.mood);
      }
    });

    // Calculate average mood for each day
    Object.keys(days).forEach((dayKey) => {
      const day = days[parseInt(dayKey)];
      if (day.moods.length > 0) {
        day.mood = day.moods.reduce((a: number, b: number) => a + b, 0) / day.moods.length;
      } else {
        day.mood = null;
      }
      delete day.moods; // Clean up
    });

    return { year, month, days };
  },
};

// Insights mock service
export const mockInsightsService = {
  getSummary: async (): Promise<any> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const entries = mockEntries.filter((e) => e.user_id === currentUserId);
    
    // Calculate streak
    const sortedEntries = entries
      .map((e) => new Date(e.date))
      .sort((a, b) => b.getTime() - a.getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i]);
      entryDate.setHours(0, 0, 0, 0);
      const daysDiff = Math.floor((today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff === i) {
        streak++;
      } else {
        break;
      }
    }

    // Calculate average mood
    const moods = entries.filter((e) => e.mood !== null).map((e) => e.mood!);
    const avgMood = moods.length > 0 ? moods.reduce((a, b) => a + b, 0) / moods.length : null;

    return {
      streak,
      entry_count: entries.length,
      average_mood: avgMood,
    };
  },

  getMoodTrend: async (days: number = 30): Promise<any> => {
    if (!currentUserId) throw new Error('Not authenticated');
    const entries = mockEntries
      .filter((e) => e.user_id === currentUserId && e.mood !== null)
      .slice(-days)
      .map((e) => ({
        date: e.date,
        mood: e.mood!,
      }));

    return entries;
  },
};

