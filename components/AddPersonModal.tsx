'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, MapPin, FileText, UserPlus, Image, Wand2 } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface AddPersonModalProps {
  onClose: () => void;
  parentId?: string;
}

// Random data generators
const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Lewis', 'Robinson', 'Walker', 'Young'];
const roles = ['Father', 'Mother', 'Son', 'Daughter', 'Uncle', 'Aunt', 'Grandfather', 'Grandmother', 'Brother', 'Sister', 'Cousin', 'Nephew', 'Niece'];
const locations = ['London, UK', 'Manchester, UK', 'Birmingham, UK', 'Leeds, UK', 'Glasgow, Scotland', 'Liverpool, UK', 'Edinburgh, Scotland', 'Bristol, UK', 'Cardiff, Wales', 'Sheffield, UK', 'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Paris, France', 'Berlin, Germany', 'Madrid, Spain', 'Rome, Italy', 'Toronto, Canada', 'Sydney, Australia', 'Tokyo, Japan'];
const bios = [
  'A loving family member with a passion for gardening.',
  'Enjoys reading, traveling, and spending time with family.',
  'Retired teacher who loves classical music.',
  'Avid sports fan and outdoor enthusiast.',
  'Works in technology and loves innovation.',
  'Chef who enjoys experimenting with new recipes.',
  'Artist with a passion for painting landscapes.',
  'Musician who plays guitar in a local band.',
  'Veterinarian who cares deeply about animals.',
  'Architect with an eye for modern design.',
];

const generateRandomData = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const currentYear = new Date().getFullYear();
  const birthYear = Math.floor(Math.random() * (2010 - 1940 + 1)) + 1940;
  
  return {
    name: `${firstName} ${lastName}`,
    role: roles[Math.floor(Math.random() * roles.length)],
    birth: birthYear.toString(),
    location: locations[Math.floor(Math.random() * locations.length)],
    bio: bios[Math.floor(Math.random() * bios.length)],
    avatar: '',
  };
};

const AddPersonModal: React.FC<AddPersonModalProps> = ({ onClose, parentId }) => {
  const addPerson = useAppStore((state) => state.addPerson);

  const [formData, setFormData] = useState(generateRandomData());

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[AddPersonModal] Creating person with parentId:', parentId);
    
    // Let backend handle avatar generation if not provided
    await addPerson({
      name: formData.name,
      role: formData.role,
      birth: formData.birth,
      location: formData.location,
      bio: formData.bio,
      avatar: formData.avatar, // Send empty string if not set - backend will generate default
      children: [],
    }, parentId);

    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[99999] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl animate-in slide-in-from-bottom-8 duration-500 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add Family Member</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:scale-110 transition-transform active:scale-95"
          >
            <X size={18} className="text-slate-700 dark:text-slate-300" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Auto-generate button */}
          <button
            type="button"
            onClick={() => setFormData(generateRandomData())}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white rounded-lg font-medium transition-all active:scale-95"
          >
            <Wand2 size={18} />
            Generate Random Data
          </button>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <User size={16} />
              Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <User size={16} />
              Role *
            </label>
            <input
              type="text"
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="Father, Mother, Uncle, etc."
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Calendar size={16} />
              Birth Year *
            </label>
            <input
              type="text"
              required
              value={formData.birth}
              onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="1990"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <MapPin size={16} />
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="London, UK"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <Image size={16} />
              Avatar URL (optional)
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
              placeholder="https://... (leave empty for auto-generated)"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              <FileText size={16} />
              Bio (optional)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-slate-900 dark:text-white resize-none"
              placeholder="Tell us about this person..."
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors active:scale-95"
            >
              Add Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPersonModal;
