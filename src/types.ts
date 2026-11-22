export enum AddonType {
  BEHAVIOR = 'behavior',
  RESOURCE = 'resource',
  BOTH = 'both'
}

export interface MinecraftManifest {
  format_version: number;
  header: {
    name: string;
    description: string;
    uuid: string;
    version: [number, number, number];
    min_engine_version: [number, number, number];
  };
  modules: {
    type: string;
    uuid: string;
    version: [number, number, number];
  }[];
}

export interface AddonFile {
  name: string;
  path: string;
  content: string;
  type: 'file' | 'directory';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  type: AddonType;
  version: string;
  minGameVersion: string;
  createdAt: number;
  updatedAt: number;
  files: Record<string, string>; // path -> content
  userId: string;
}

export interface CommunityAddon {
  id: string;
  projectId: string;
  authorId: string;
  authorName: string;
  name: string;
  description: string;
  downloadUrl: string;
  createdAt: number;
  expiresAt: number;
}
