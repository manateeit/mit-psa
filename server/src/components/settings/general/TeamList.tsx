'use client';
import React, { useState } from 'react';
import { createTeam, deleteTeam } from '@/lib/actions/team-actions/teamActions';
import { ITeam } from '@/interfaces/auth.interfaces';

interface TeamListProps {
  teams: ITeam[];
  onSelectTeam: (team: ITeam | null) => void;
}

const TeamList: React.FC<TeamListProps> = ({ teams, onSelectTeam }) => {
  const [newTeamName, setNewTeamName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreateTeam = async (): Promise<void> => {
    if (newTeamName.trim()) {
      try {
        const newTeam: ITeam = {
          team_name: newTeamName,
          members: [],
          manager_id: null,
          team_id: '',
        };
        const createdTeam = await createTeam(newTeam);
        onSelectTeam(createdTeam);
        setNewTeamName('');
        setError(null);
      } catch (err: unknown) {
        setError(`Failed to create team: ${err instanceof Error ? err.message : String(err)}`);
        console.error('Error creating team:', err);
      }
    }
  };

  const handleDeleteTeam = async (teamId: string): Promise<void> => {
    try {
      await deleteTeam(teamId);
      onSelectTeam(null);
      setError(null);
    } catch (err: unknown) {
      setError('Failed to delete team');
      console.error('Error deleting team:', err);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-border-200">
      <h2 className="text-xl font-bold mb-4 text-text-900">Team Management</h2>
      {error && <p className="text-accent-500 mb-4">{error}</p>}
      <div className="mb-4">
        <input
          type="text"
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          className="w-full p-2 border border-border-200 rounded focus:outline-none focus:border-primary-500"
          placeholder="Enter new team name"
        />
        <button
          onClick={handleCreateTeam}
          className="mt-2 w-full bg-primary-500 text-white p-2 rounded hover:bg-primary-600 transition-colors"
        >
          Create New Team
        </button>
      </div>
      <h3 className="text-lg font-semibold mb-2 text-text-800">Teams</h3>
      <ul className="space-y-2">
        {teams.map((team: ITeam): React.ReactNode => (
          <li key={team.team_id} className="flex items-center justify-between p-2 rounded hover:bg-border-50">
            <button
              onClick={() => onSelectTeam(team)}
              className="text-left font-medium text-text-700 hover:text-primary-500 transition-colors"
            >
              {team.team_name}
            </button>
            <button
              onClick={() => handleDeleteTeam(team.team_id)}
              className="bg-accent-500 text-white px-3 py-1 rounded hover:bg-accent-600 transition-colors"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamList;
