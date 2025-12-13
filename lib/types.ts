export interface Person {
  id: string;
  name: string;
  role: string;
  birth: string;
  location: string;
  avatar: string;
  bio: string;
  children: string[];
}

export interface CreatorInfo {
  name: string;
  role: string;
  bio: string;
  socials: {
    twitter: string;
    github: string;
    linkedin: string;
  };
}
