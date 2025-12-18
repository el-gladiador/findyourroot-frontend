import { Person, CreatorInfo } from './types';

export const FAMILY_DATA: Person[] = [
  {
    id: 'root-1',
    name: "Arthur Pendelton",
    role: "Grandfather",
    birth: "1945",
    location: "Yorkshire, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arthur&backgroundColor=b6e3f4",
    bio: "The patriarch of the family. Served in the navy and loves woodworking.",
    children: ['gen2-1', 'gen2-2']
  },
  {
    id: 'root-wife',
    name: "Martha Pendelton",
    role: "Grandmother",
    birth: "1948",
    location: "Yorkshire, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Martha&backgroundColor=ffdfbf",
    bio: "Best apple pie baker in the county. Loves gardening.",
    children: [] // Married to Arthur
  },
  {
    id: 'gen2-1',
    name: "James Pendelton",
    role: "Father",
    birth: "1975",
    location: "London, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=James&backgroundColor=c0aede",
    bio: "Architect. Loves modern design and hiking.",
    children: ['gen3-1', 'gen3-2']
  },
  {
    id: 'gen2-wife',
    name: "Sarah Pendelton",
    role: "Mother",
    birth: "1978",
    location: "London, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah&backgroundColor=ffd5dc",
    bio: "Doctor. Avid reader and runner.",
    children: []
  },
  {
    id: 'gen2-2',
    name: "Elizabeth Claire",
    role: "Aunt",
    birth: "1980",
    location: "Bristol, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Elizabeth&backgroundColor=d1d4f9",
    bio: "Artist and freelance graphic designer.",
    children: ['gen3-3']
  },
  {
    id: 'gen3-1',
    name: "Thomas Pendelton",
    role: "Son",
    birth: "2005",
    location: "London, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas&backgroundColor=e5e7eb",
    bio: "University student studying Computer Science.",
    children: []
  },
  {
    id: 'gen3-2',
    name: "Lucy Pendelton",
    role: "Daughter",
    birth: "2008",
    location: "London, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucy&backgroundColor=ffdfbf",
    bio: "High school student. Plays the violin.",
    children: []
  },
  {
    id: 'gen3-3',
    name: "Oliver Claire",
    role: "Cousin",
    birth: "2010",
    location: "Bristol, UK",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=b6e3f4",
    bio: "Loves soccer and video games.",
    children: []
  }
];

export const CREATOR_INFO: CreatorInfo = {
  name: "Zaki Amiri",
  role: "Software & Cloud Engineer",
  bio: "I always wanted to create a digital version of our family tree that everyone could access and contribute to. Growing up, I heard so many stories about our ancestors, but they were scattered across different people's memories. This app is my way of bringing all those stories together in one beautiful, interactive place that our whole family can enjoy and build upon together.",
  socials: {
    instagram: "_zaki.amiri_",
    github: "el-gladiador",
    linkedin: ""
  }
};
