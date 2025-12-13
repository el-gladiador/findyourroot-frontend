import { Person } from './types';

export const exportToJSON = (data: Person[]) => {
  const json = JSON.stringify(data, null, 2);
  downloadFile(json, 'family-tree.json', 'application/json');
};

export const exportToCSV = (data: Person[]) => {
  const headers = ['ID', 'Name', 'Role', 'Birth Year', 'Location', 'Bio'];
  const rows = data.map(person => [
    person.id,
    person.name,
    person.role,
    person.birth,
    person.location,
    person.bio
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  downloadFile(csv, 'family-tree.csv', 'text/csv');
};

export const exportToPDF = (data: Person[]) => {
  // Simple PDF generation using data URL
  // In production, you'd use a library like jsPDF
  const content = data.map(person => 
    `${person.name} (${person.role})\nBorn: ${person.birth}\nLocation: ${person.location}\n${person.bio}\n\n`
  ).join('');

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'family-tree.txt';
  a.click();
  URL.revokeObjectURL(url);
};

const downloadFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const shareData = async (title: string, text: string, url?: string) => {
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return true;
    } catch (error) {
      console.error('Error sharing:', error);
      return false;
    }
  } else {
    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }
};
