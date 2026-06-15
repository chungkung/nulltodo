import React, { useState, useEffect } from 'react';
import api from '@/services/api';
import { BackupSummary } from '@/types';

const BackupSync: React.FC = () => {
  const [backupSummary, setBackupSummary] = useState<BackupSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await api.listBackups();
      if (response.success && response.data) {
        setBackupSummary(response.data);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      const response = await api.createBackup(false);
      if (response.success) {
        alert('Backup created successfully!');
        fetchBackups();
      } else {
        alert('Failed to create backup');
      }
    } catch (error) {
      alert('Failed to create backup');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const backups = Array.isArray(backupSummary?.backups) ? backupSummary.backups : 
                 Array.isArray(backupSummary) ? backupSummary : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Data Backup & Sync</h2>
        <button
          onClick={handleCreateBackup}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Create Backup
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup List</h3>
        {backups.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No backups yet</p>
            <p className="text-sm mt-2">Click the button above to create your first backup</p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup, idx) => {
              const filename = backup.filename || backup.file_name || 'Unknown';
              return (
                <div key={idx} className="border p-4 rounded-lg">
                  <div className="font-medium">{filename}</div>
                  <div className="text-sm text-gray-600">
                    Created: {backup.created_at}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default BackupSync;
