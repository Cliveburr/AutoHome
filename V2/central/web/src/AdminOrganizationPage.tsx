import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import {
  createAdministrativeArea,
  createAdministrativeRoom,
  deleteAdministrativeArea,
  deleteAdministrativeRoom,
  listAdministrativeAreas,
  listAdministrativeRooms,
  updateAdministrativeArea,
  updateAdministrativeRoom,
  type Area,
  type Room,
} from './api/client';

const areasKey = ['administration', 'areas'] as const;
const roomsKey = ['administration', 'rooms'] as const;

export function AdminOrganizationPage() {
  const queryClient = useQueryClient();
  const areas = useQuery({ queryKey: areasKey, queryFn: listAdministrativeAreas });
  const rooms = useQuery({ queryKey: roomsKey, queryFn: listAdministrativeRooms });
  const [areaName, setAreaName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [roomAreaId, setRoomAreaId] = useState('');
  const [error, setError] = useState<string>();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: areasKey });
    void queryClient.invalidateQueries({ queryKey: roomsKey });
    void queryClient.invalidateQueries({ queryKey: ['operation', 'inventory'] });
  };
  const mutationOptions = {
    onError: (cause: unknown) =>
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a alteração.'),
    onSuccess: () => {
      setError(undefined);
      invalidate();
    },
  };
  const createArea = useMutation({
    mutationFn: () => createAdministrativeArea({ name: areaName.trim() }),
    ...mutationOptions,
  });
  const createRoom = useMutation({
    mutationFn: () =>
      createAdministrativeRoom({
        name: roomName.trim(),
        ...(roomAreaId ? { areaId: roomAreaId } : {}),
      }),
    ...mutationOptions,
  });

  if (areas.isLoading || rooms.isLoading)
    return <p className="page-status">Carregando organização…</p>;
  if (areas.isError || rooms.isError)
    return (
      <p className="page-status" role="alert">
        Não foi possível carregar áreas e cômodos.
      </p>
    );

  return (
    <section aria-labelledby="organization-title">
      <h2 id="organization-title">Áreas e cômodos</h2>
      <p>Organize os cômodos usados na operação da residência.</p>
      {error ? (
        <p className="page-status" role="alert">
          {error}
        </p>
      ) : null}

      <div className="admin-grid">
        <section className="admin-card" aria-labelledby="areas-title">
          <h3 id="areas-title">Áreas</h3>
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!areaName.trim()) return;
              createArea.mutate();
              setAreaName('');
            }}
          >
            <input
              aria-label="Nome da nova área"
              value={areaName}
              onChange={(event) => setAreaName(event.target.value)}
              placeholder="Nova área"
            />
            <button type="submit" disabled={createArea.isPending}>
              Criar
            </button>
          </form>
          <ul className="admin-list">
            {areas.data?.map((area) => (
              <AreaRow key={area.id} area={area} onChanged={invalidate} onError={setError} />
            ))}
          </ul>
        </section>

        <section className="admin-card" aria-labelledby="rooms-title">
          <h3 id="rooms-title">Cômodos</h3>
          <form
            className="inline-form"
            onSubmit={(event) => {
              event.preventDefault();
              if (!roomName.trim()) return;
              createRoom.mutate();
              setRoomName('');
            }}
          >
            <input
              aria-label="Nome do novo cômodo"
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
              placeholder="Novo cômodo"
            />
            <select
              aria-label="Área do novo cômodo"
              value={roomAreaId}
              onChange={(event) => setRoomAreaId(event.target.value)}
            >
              <option value="">Sem área</option>
              {areas.data?.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
            <button type="submit" disabled={createRoom.isPending}>
              Criar
            </button>
          </form>
          <ul className="admin-list">
            {rooms.data?.map((room) => (
              <RoomRow
                key={room.id}
                room={room}
                areas={areas.data ?? []}
                onChanged={invalidate}
                onError={setError}
              />
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}

function AreaRow({
  area,
  onChanged,
  onError,
}: {
  area: Area;
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(area.name);
  const mutation = useMutation({
    mutationFn: () => updateAdministrativeArea(area.id, { name: name.trim() }),
    onSuccess: onChanged,
    onError: (cause: unknown) =>
      onError(cause instanceof Error ? cause.message : 'Não foi possível atualizar a área.'),
  });
  const remove = useMutation({
    mutationFn: () => deleteAdministrativeArea(area.id),
    onSuccess: onChanged,
    onError: (cause: unknown) =>
      onError(cause instanceof Error ? cause.message : 'Não foi possível excluir a área.'),
  });
  return (
    <li>
      <input
        aria-label={`Nome da área ${area.name}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={!name.trim() || mutation.isPending}
      >
        Salvar
      </button>
      <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending}>
        Excluir
      </button>
    </li>
  );
}

function RoomRow({
  room,
  areas,
  onChanged,
  onError,
}: {
  room: Room;
  areas: Area[];
  onChanged: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(room.name);
  const [areaId, setAreaId] = useState(room.areaId ?? '');
  const mutation = useMutation({
    mutationFn: () =>
      updateAdministrativeRoom(room.id, { name: name.trim(), areaId: areaId || null }),
    onSuccess: onChanged,
    onError: (cause: unknown) =>
      onError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o cômodo.'),
  });
  const remove = useMutation({
    mutationFn: () => deleteAdministrativeRoom(room.id),
    onSuccess: onChanged,
    onError: (cause: unknown) =>
      onError(cause instanceof Error ? cause.message : 'Não foi possível excluir o cômodo.'),
  });
  return (
    <li>
      <input
        aria-label={`Nome do cômodo ${room.name}`}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <select
        aria-label={`Área do cômodo ${room.name}`}
        value={areaId}
        onChange={(event) => setAreaId(event.target.value)}
      >
        <option value="">Sem área</option>
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => mutation.mutate()}
        disabled={!name.trim() || mutation.isPending}
      >
        Salvar
      </button>
      <button type="button" onClick={() => remove.mutate()} disabled={remove.isPending}>
        Excluir
      </button>
    </li>
  );
}
