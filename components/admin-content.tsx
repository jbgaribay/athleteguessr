'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';
import { LogoutButton } from '@/components/logout-button';

interface Player {
  id?: string;
  name: string;
  sport: string;
  birth_city: string;
  birth_state: string;
  birth_country: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  position: string;
  team: string | null;
  years_active: string | null;
  is_active: boolean;
  difficulty_level: string;
  city_fact: string;
}

const emptyPlayer: Player = {
  name: '',
  sport: 'nfl',
  birth_city: '',
  birth_state: '',
  birth_country: 'USA',
  latitude: 0,
  longitude: 0,
  photo_url: null,
  position: '',
  team: null,
  years_active: null,
  is_active: false,
  difficulty_level: 'medium',
  city_fact: '',
};

export default function AdminContent({ userEmail }: { userEmail: string }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [editingPlayer, setEditingPlayer] = useState<Player>(emptyPlayer);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('sport', 'nfl')
      .order('name');

    if (error) {
      console.error('Error loading players:', error);
      setMessage({ type: 'error', text: 'Error loading players' });
    } else {
      setPlayers(data || []);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (editingPlayer.id) {
      // Update existing player
      const { error } = await supabase
        .from('players')
        .update(editingPlayer)
        .eq('id', editingPlayer.id);

      if (error) {
        setMessage({ type: 'error', text: 'Error updating player: ' + error.message });
      } else {
        setMessage({ type: 'success', text: 'Player updated successfully!' });
        loadPlayers();
        setEditingPlayer(emptyPlayer);
        setIsEditing(false);
      }
    } else {
      // Insert new player
      const { error } = await supabase
        .from('players')
        .insert([editingPlayer]);

      if (error) {
        setMessage({ type: 'error', text: 'Error adding player: ' + error.message });
      } else {
        setMessage({ type: 'success', text: 'Player added successfully!' });
        loadPlayers();
        setEditingPlayer(emptyPlayer);
      }
    }

    setTimeout(() => setMessage(null), 5000);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this player?')) return;

    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', id);

    if (error) {
      setMessage({ type: 'error', text: 'Error deleting player: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Player deleted successfully!' });
      loadPlayers();
    }

    setTimeout(() => setMessage(null), 5000);
  }

  function handleEdit(player: Player) {
    setEditingPlayer(player);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancel() {
    setEditingPlayer(emptyPlayer);
    setIsEditing(false);
  }

  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.birth_city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b p-4">
  <div className="container mx-auto flex justify-between items-center">
    <div>
      <h1 className="text-2xl font-bold">NFL Players Admin</h1>
      <p className="text-sm text-muted-foreground">Logged in as: {userEmail}</p>
    </div>
    <div className="flex gap-2">
  <a href="/">
    <Button variant="outline">Back to Home</Button>
  </a>
  <LogoutButton />
</div>
  </div>
</header>

      <div className="container mx-auto p-6">
        {message && (
          <div
            className={`mb-4 p-4 rounded ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Add/Edit Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{isEditing ? 'Edit Player' : 'Add New Player'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={editingPlayer.name}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Input
                    id="position"
                    placeholder="QB, RB, WR, etc."
                    value={editingPlayer.position}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="team">Team</Label>
                  <Input
                    id="team"
                    value={editingPlayer.team || ''}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, team: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="years_active">Years Active</Label>
                  <Input
                    id="years_active"
                    placeholder="2000-2023"
                    value={editingPlayer.years_active || ''}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, years_active: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="birth_city">Birth City *</Label>
                  <Input
                    id="birth_city"
                    value={editingPlayer.birth_city}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, birth_city: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="birth_state">Birth State *</Label>
                  <Input
                    id="birth_state"
                    value={editingPlayer.birth_state}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, birth_state: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="latitude">Latitude *</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.000001"
                    value={editingPlayer.latitude}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, latitude: parseFloat(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get coordinates from <a href="https://www.google.com/maps" target="_blank" className="underline">Google Maps</a> (right-click → What's here?)
                  </p>
                </div>

                <div>
                  <Label htmlFor="longitude">Longitude *</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.000001"
                    value={editingPlayer.longitude}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, longitude: parseFloat(e.target.value) })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="photo_url">Photo URL</Label>
                  <Input
                    id="photo_url"
                    placeholder="https://..."
                    value={editingPlayer.photo_url || ''}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, photo_url: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Find photos on <a href="https://commons.wikimedia.org" target="_blank" className="underline">Wikimedia Commons</a>
                  </p>
                </div>

                <div>
                  <Label htmlFor="difficulty_level">Difficulty</Label>
                  <Select
                    value={editingPlayer.difficulty_level}
                    onValueChange={(value) => setEditingPlayer({ ...editingPlayer, difficulty_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="city_fact">City Fact *</Label>
                  <Textarea
                    id="city_fact"
                    rows={3}
                    placeholder="Interesting fact about the birthplace city..."
                    value={editingPlayer.city_fact}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, city_fact: e.target.value })}
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={editingPlayer.is_active}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, is_active: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="is_active">Currently Active Player</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {isEditing ? 'Update Player' : 'Add Player'}
                </Button>
                {isEditing && (
                  <Button type="button" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Players List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Players ({filteredPlayers.length})</CardTitle>
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-xs"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {filteredPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-3 border rounded hover:bg-muted"
                >
                  <div className="flex-1">
                    <div className="font-semibold">{player.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {player.position} • {player.birth_city}, {player.birth_state}
                      {player.team && ` • ${player.team}`}
                      {player.years_active && ` • ${player.years_active}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(player)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(player.id!)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              {filteredPlayers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No players found. {searchTerm && 'Try a different search term.'}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}